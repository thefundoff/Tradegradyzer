import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const dest = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to analyze your charts."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
            Create an account
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
        <div>
          <Field
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-white/55 underline underline-offset-4 decoration-white/20 transition hover:text-white hover:decoration-white"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Log in'}
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
