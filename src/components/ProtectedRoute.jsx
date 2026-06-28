import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, profile, loading, signingOut } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (!user) {
    // Mid sign-out the handler is already routing to '/'. Redirecting to
    // /login from here too would deadlock the page transition, so just let
    // this page animate out.
    if (signingOut) return null
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // One-time trading-profile gate: send un-onboarded users (Google signups,
  // pre-existing accounts) through /onboarding so their analysis is tailored.
  if (profile && profile.onboarded === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace state={{ from: location }} />
  }

  return children
}
