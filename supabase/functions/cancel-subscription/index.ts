// Supabase Edge Function: cancel-subscription
// Marks the caller's subscription as canceled. We keep `subscription_expires_at`
// so the user retains access until the period they already paid for ends —
// it simply won't renew. (Subscription columns are server-locked; only the
// service role can write them.)

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
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Unauthorized.' }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data, error } = await admin
      .from('profiles')
      .update({ subscription_status: 'canceled' })
      .eq('id', user.id)
      .select()
      .single()
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true, profile: data }, 200)
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
