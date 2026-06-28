import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthShell from '../components/layout/AuthShell'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import TradingProfileForm from '../components/TradingProfileForm'
import { useAuthStore } from '../store/authStore'

/**
 * One-time gate for users who signed up before the trading profile existed
 * (or via Google). ProtectedRoute redirects here until `onboarded` is true.
 */
export default function Onboarding() {
  const { profile, updateTradingProfile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const dest = location.state?.from?.pathname || '/dashboard'

  const [tp, setTp] = useState({
    style: profile?.trader_style || '',
    setups: profile?.setups || [],
    risk: profile?.risk_appetite || '',
    markets: profile?.markets || [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!tp.style) {
      setError('Pick the kind of trader you are so we can tailor your analysis.')
      return
    }
    setLoading(true)
    try {
      await updateTradingProfile(tp)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not save your profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Tell us how you trade"
      subtitle="A few quick questions so every grade — entry, stop and target — fits your style."
    >
      <form onSubmit={submit} className="space-y-5">
        <TradingProfileForm value={tp} onChange={setTp} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Save & continue'}
        </Button>
      </form>
    </AuthShell>
  )
}
