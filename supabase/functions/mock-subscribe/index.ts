// Supabase Edge Function: mock-subscribe
// Server-side subscription activation. Because subscription_* columns are
// locked against client writes (see migration 0003), activation MUST happen
// here with the service role.
//
// 🔧 MOCK: this grants the plan without charging. When you wire Paystack,
// replace the "grant" block with: verify the transaction via Paystack's API
// using your secret key, and only then update the profile. The rest stays.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Unauthorized.' }, 401)

    const { plan } = await req.json()
    if (plan !== 'weekly' && plan !== 'monthly' && plan !== 'lifetime') {
      return json({ error: 'Invalid plan.' }, 400)
    }

    // ── Grant (MOCK). Replace with Paystack verification before launch. ──
    // Lifetime is a one-time purchase → null expiry means it never lapses.
    let expiresAt: string | null = null
    if (plan !== 'lifetime') {
      const expires = new Date()
      if (plan === 'weekly') expires.setDate(expires.getDate() + 7)
      else expires.setMonth(expires.getMonth() + 1)
      expiresAt = expires.toISOString()
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data, error } = await admin
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires_at: expiresAt,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) return json({ error: error.message }, 500)
    return json({ ok: true, profile: data }, 200)
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
