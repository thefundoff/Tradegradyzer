import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowLeft, ArrowRight } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import TradingProfileForm from '../components/TradingProfileForm'
import { useAuthStore } from '../store/authStore'

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tp, setTp] = useState({ style: '', setups: [], risk: '', markets: [] })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1 → validate account fields, then advance to the trading profile.
  const next = (e) => {
    e.preventDefault()
    setError('')
    if (!fullName || !email) {
      setError('Please fill in your name and email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setStep(2)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!tp.style) {
      setError('Pick the kind of trader you are so we can tailor your analysis.')
      return
    }
    setLoading(true)
    try {
      const { session } = await signUp(email, password, fullName, tp)
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

  if (step === 2) {
    return (
      <AuthShell
        title="Tell us how you trade"
        subtitle="We tune every grade — entry, stop and target — to your style."
        footer={
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setError('')
            }}
            className="inline-flex items-center gap-1 font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <form onSubmit={submit} className="space-y-5">
          <TradingProfileForm value={tp} onChange={setTp} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : 'Create account'}
          </Button>
        </form>
      </AuthShell>
    )
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
      <form onSubmit={next} className="space-y-4">
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
        <Button type="submit" size="lg" className="w-full">
          <span className="flex items-center gap-2">
            Continue <ArrowRight size={18} />
          </span>
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-white/35">
        <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
      </div>

      <Button variant="ghost" size="lg" className="w-full" onClick={() => signInWithGoogle().catch((e) => setError(e.message))}>
        Continue with Google
      </Button>

      <p className="mt-5 text-center text-xs text-white/40">
        By creating an account you agree to our{' '}
        <Link to="/terms" className="text-white/60 underline underline-offset-2 hover:text-white">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-white/60 underline underline-offset-2 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  )
}
