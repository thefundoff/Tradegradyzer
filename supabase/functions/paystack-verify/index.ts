// Supabase Edge Function: paystack-verify
// Verifies a Paystack transaction server-side (with the secret key), checks the
// amount against our own price table, then grants the subscription — once.
//
// Secret: supabase secrets set PAYSTACK_SECRET_KEY=sk_...

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// Server-side source of truth for prices (mirror src/lib/constants.js).
const PRICE_TIERS: Record<string, { weekly: number; monthly: number; lifetime: number }> = {
  USD: { weekly: 5, monthly: 15, lifetime: 5 },
  NGN: { weekly: 3900, monthly: 14000, lifetime: 15000 },
  GHS: { weekly: 70, monthly: 200, lifetime: 70 },
  ZAR: { weekly: 90, monthly: 270, lifetime: 95 },
  KES: { weekly: 650, monthly: 1900, lifetime: 700 },
}

type Plan = 'weekly' | 'monthly' | 'lifetime'

// Campaign cap — keep in sync with LIFETIME_LIMIT in src/lib/constants.js.
const LIFETIME_LIMIT = 100

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Refund a charge we can't honor (e.g. the last lifetime seat just sold).
// Best-effort: Paystack also lets you refund manually from the dashboard.
async function refundTransaction(reference: string) {
  try {
    await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: reference }),
    })
  } catch (_err) {
    // Swallow — the caller still reports sold_out; reconcile from the dashboard.
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!PAYSTACK_SECRET) return json({ ok: false, error: 'Paystack not configured.' }, 500)

    // Identify caller.
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401)

    const { reference, plan } = await req.json()
    if (!reference || (plan !== 'weekly' && plan !== 'monthly' && plan !== 'lifetime')) {
      return json({ ok: false, error: 'Invalid request.' }, 400)
    }

    // Verify with Paystack.
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
    )
    const pj = await res.json()
    const tx = pj?.data
    if (!pj?.status || tx?.status !== 'success') {
      return json({ ok: false, error: 'Payment was not successful.' }, 200)
    }

    // Validate the amount against our price table (prevents tampering).
    const tier = PRICE_TIERS[tx.currency]
    const expected = tier?.[plan as Plan]
    if (!expected) return json({ ok: false, error: 'Unsupported currency.' }, 200)
    if (Number(tx.amount) < expected * 100) {
      return json({ ok: false, error: 'Amount paid is below the plan price.' }, 200)
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // ── Lifetime is a CAPPED, one-time purchase ──────────────────
    // Claim a seat atomically (advisory-locked in the DB so concurrent
    // payments can't oversell the cap). If the last seat sold between
    // checkout and now, refund the charge instead of taking their money.
    if (plan === 'lifetime') {
      const { data: outcome, error: rpcErr } = await admin.rpc('claim_lifetime_seat', {
        p_user_id: user.id,
        p_reference: reference,
        p_amount: tx.amount,
        p_currency: tx.currency,
        p_limit: LIFETIME_LIMIT,
      })
      if (rpcErr) return json({ ok: false, error: rpcErr.message }, 500)
      if (outcome === 'sold_out') {
        await refundTransaction(reference)
        return json({ ok: false, error: 'sold_out', refunded: true }, 200)
      }
      const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
      return json({ ok: true, profile, alreadyProcessed: outcome === 'already' }, 200)
    }

    // ── Recurring plans (weekly / monthly) ───────────────────────
    // Idempotency: record the reference first. If it already exists, this
    // payment was already processed — return current state without re-granting.
    const { error: payErr } = await admin.from('payments').insert({
      user_id: user.id,
      reference,
      plan,
      amount: tx.amount,
      currency: tx.currency,
    })
    if (payErr) {
      if (payErr.code === '23505') {
        const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
        return json({ ok: true, profile, alreadyProcessed: true }, 200)
      }
      return json({ ok: false, error: payErr.message }, 500)
    }

    // Grant the subscription (service role bypasses the column lock).
    const expires = new Date()
    if (plan === 'weekly') expires.setDate(expires.getDate() + 7)
    else expires.setMonth(expires.getMonth() + 1)

    const { data: profile, error } = await admin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expires.toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()
    if (error) return json({ ok: false, error: error.message }, 500)

    return json({ ok: true, profile }, 200)
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500)
  }
})
