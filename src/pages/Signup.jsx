import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { session } = await signUp(email, password, fullName)
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        setNotice('Check your inbox to confirm your email, then log in.')
      }
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start grading your setups in seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Full name"
          icon={User}
          placeholder="Jane Trader"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {notice && <p className="text-sm text-emerald-400">{notice}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Create account'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-white/35">
        <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button variant="ghost" size="lg" className="w-full" onClick={() => signInWithGoogle().catch((e) => setError(e.message))}>
        Continue with Google
      </Button>
    </AuthShell>
  )
}
