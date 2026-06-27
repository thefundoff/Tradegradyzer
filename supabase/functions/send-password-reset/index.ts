// Supabase Edge Function: send-password-reset
// Generates a Supabase password-recovery link (service role) and emails it to
// the user via Resend with a branded TradeGradyzer template.
//
// Public function (verify_jwt = false) — the caller isn't signed in. We never
// reveal whether an email is registered (anti-enumeration): if the address has
// no account we still respond { ok: true } without sending anything.
//
// Secrets (set on the project, not in the frontend):
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set RESEND_FROM="TradeGradyzer <noreply@yourdomain.com>"
//   supabase secrets set SITE_URL=https://tradegradyzer.vercel.app
//
// Also add `${SITE_URL}/reset-password` to Supabase Auth → URL Configuration →
// Redirect URLs, or the recovery link falls back to the Site URL.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
// resend.dev sender works without domain setup but only mails the account owner.
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'TradeGradyzer <onboarding@resend.dev>'
const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Branded, dark-theme reset email (inline styles for email-client safety).
function resetEmailHtml(link: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#000;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#0b0b0b;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;background:#e8b84b;border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;line-height:40px;">📈</td>
                <td style="padding-left:12px;color:#ededed;font-size:18px;font-weight:700;">TradeGradyzer</td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 0;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Reset your password</h1>
            <p style="margin:12px 0 0;color:#a1a1a1;font-size:15px;line-height:1.6;">
              We received a request to reset the password for your TradeGradyzer account.
              Click the button below to choose a new one.
            </p>
          </td></tr>
          <tr><td style="padding:28px 32px 8px;">
            <a href="${link}" style="display:inline-block;background:#e8b84b;color:#1a1404;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
              Reset password
            </a>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <p style="margin:0;color:#6f6f6f;font-size:13px;line-height:1.6;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely
              ignore this email — your password won't change.
            </p>
          </td></tr>
          <tr><td style="padding:20px 32px 0;">
            <p style="margin:0;color:#5a5a5a;font-size:12px;line-height:1.6;word-break:break-all;">
              Button not working? Paste this link into your browser:<br/>
              <a href="${link}" style="color:#e8b84b;text-decoration:underline;">${link}</a>
            </p>
          </td></tr>
          <tr><td style="padding:28px 32px 32px;">
            <div style="border-top:1px solid #1f1f1f;padding-top:16px;">
              <p style="margin:0;color:#5a5a5a;font-size:12px;">TradeGradyzer · AI chart analysis · Not financial advice</p>
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!RESEND_API_KEY) return json({ ok: false, error: 'Email service is not configured.' }, 500)

    const { email } = await req.json().catch(() => ({ email: '' }))
    if (!email || !EMAIL_RE.test(String(email))) {
      return json({ ok: false, error: 'Enter a valid email address.' }, 400)
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const redirectTo = `${SITE_URL || new URL(req.url).origin}/reset-password`

    // Mint a one-time recovery link. Errors here usually mean "no such user" —
    // we swallow that and report success so the endpoint can't be used to probe
    // which emails have accounts.
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: String(email),
      options: { redirectTo },
    })

    const link = data?.properties?.action_link
    if (error || !link) return json({ ok: true }, 200)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [String(email)],
        subject: 'Reset your TradeGradyzer password',
        html: resetEmailHtml(link),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('Resend send failed:', res.status, detail)
      return json({ ok: false, error: 'Could not send the reset email. Please try again.' }, 502)
    }

    return json({ ok: true }, 200)
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500)
  }
})
