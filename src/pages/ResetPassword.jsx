import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, CircleCheck } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// 'checking' → confirming the recovery link gave us a session
// 'ready'    → valid link, show the new-password form
// 'invalid'  → no/expired link
// 'done'     → password updated
export default function ResetPassword() {
  const { updatePassword } = useAuthStore()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // The recovery link drops tokens in the URL hash; supabase-js parses them
  // (detectSessionInUrl) and emits PASSWORD_RECOVERY. Accept either that event
  // or an already-present session as proof the link is valid.
  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('ready')
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) {
        setPhase('ready')
        return
      }
      // No session yet. Inspect the URL: Supabase delivers the recovery token
      // either in the hash (implicit: #access_token / #type=recovery) or the
      // query (PKCE: ?code / ?token_hash / ?type=recovery), and reports failures
      // via an error param. Mark invalid only when there's clearly no token.
      const url = new URL(window.location.href)
      const hash = url.hash || ''
      const q = url.searchParams
      const hasError =
        hash.includes('error') || q.has('error') || q.has('error_description')
      const hasToken =
        hash.includes('access_token') ||
        hash.includes('type=recovery') ||
        q.has('code') ||
        q.has('token_hash') ||
        q.get('type') === 'recovery'
      if (hasError || !hasToken) setPhase('invalid')
      // else: a token is present — wait for onAuthStateChange / the timeout.
    })

    // Fallback: if nothing resolved the link shortly, treat it as invalid.
    const t = setTimeout(() => {
      if (mounted) setPhase((p) => (p === 'checking' ? 'invalid' : p))
    }, 4000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setPhase('done')
    } catch (err) {
      setError(err.message || 'Could not update your password.')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'checking') {
    return (
      <AuthShell title="Verifying link…" subtitle="One moment while we check your reset link.">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthShell>
    )
  }

  if (phase === 'invalid') {
    return (
      <AuthShell
        title="Link expired or invalid"
        subtitle="This password-reset link is no longer valid."
        footer={
          <Link
            to="/login"
            className="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Back to log in
          </Link>
        }
      >
        <p className="text-sm text-white/60">
          Reset links expire after a short time and can only be used once. Request a fresh one to
          continue.
        </p>
        <Button className="mt-6 w-full" size="lg">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    )
  }

  if (phase === 'done') {
    return (
      <AuthShell title="Password updated" subtitle="You're all set.">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <CircleCheck size={28} />
          </div>
          <p className="text-sm text-white/60">
            Your password has been changed. You're now signed in.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/dashboard', { replace: true })}>
            Go to dashboard
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you'll remember.">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="New password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
