// Supabase Edge Function: paystack-webhook
// Receives Paystack events, verifies the signature, and grants the subscription
// on charge.success. Runs WITHOUT JWT (Paystack has no user token) — see
// config.toml (verify_jwt = false). Idempotent via the payments table.
//
// Configure in Paystack dashboard → Settings → Webhooks:
//   https://<project>.supabase.co/functions/v1/paystack-webhook

import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

// Refund a charge we can't honor (e.g. the last lifetime seat just sold).
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
    // Best-effort — reconcile from the Paystack dashboard if this fails.
  }
}

Deno.serve(async (req) => {
  try {
    const raw = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''
    const expected = createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex')
    if (signature !== expected) return new Response('invalid signature', { status: 401 })

    const event = JSON.parse(raw)
    if (event?.event !== 'charge.success') return new Response('ignored', { status: 200 })

    const tx = event.data
    const userId = tx?.metadata?.user_id
    const plan = tx?.metadata?.plan
    if (
      !userId ||
      (plan !== 'weekly' && plan !== 'monthly' && plan !== 'lifetime') ||
      tx?.status !== 'success'
    ) {
      return new Response('skipped', { status: 200 })
    }

    // Amount sanity check.
    const tier = PRICE_TIERS[tx.currency]
    if (!tier || Number(tx.amount) < tier[plan as Plan] * 100) {
      return new Response('amount mismatch', { status: 200 })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // ── Lifetime: claim a capped seat atomically, refund if sold out. ──
    if (plan === 'lifetime') {
      const { data: outcome, error: rpcErr } = await admin.rpc('claim_lifetime_seat', {
        p_user_id: userId,
        p_reference: tx.reference,
        p_amount: tx.amount,
        p_currency: tx.currency,
        p_limit: LIFETIME_LIMIT,
      })
      if (rpcErr) return new Response(rpcErr.message, { status: 500 })
      if (outcome === 'sold_out') {
        await refundTransaction(tx.reference)
        return new Response('sold_out_refunded', { status: 200 })
      }
      return new Response('ok', { status: 200 })
    }

    // ── Recurring plans: idempotent insert, then grant. ──
    const { error: payErr } = await admin.from('payments').insert({
      user_id: userId,
      reference: tx.reference,
      plan,
      amount: tx.amount,
      currency: tx.currency,
    })
    if (payErr) {
      if (payErr.code === '23505') return new Response('already processed', { status: 200 })
      return new Response(payErr.message, { status: 500 })
    }

    const expires = new Date()
    if (plan === 'weekly') expires.setDate(expires.getDate() + 7)
    else expires.setMonth(expires.getMonth() + 1)

    await admin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expires.toISOString(),
      })
      .eq('id', userId)

    return new Response('ok', { status: 200 })
  } catch (err) {
    return new Response((err as Error).message, { status: 500 })
  }
})
