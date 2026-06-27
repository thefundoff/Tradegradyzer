import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists, a reset link is on its way."
        footer={
          <Link
            to="/login"
            className="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <MailCheck size={26} />
          </div>
          <p className="text-sm text-white/60">
            We've sent a password-reset link to <span className="text-white">{email}</span>. The link
            expires in 1 hour. Check your spam folder if it doesn't arrive shortly.
          </p>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSent(false)
              setError('')
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link
            to="/login"
            className="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Back to log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  )
}
