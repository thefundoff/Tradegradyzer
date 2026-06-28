import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // One-time trading-profile gate: send un-onboarded users (Google signups,
  // pre-existing accounts) through /onboarding so their analysis is tailored.
  if (profile && profile.onboarded === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  return children
}
