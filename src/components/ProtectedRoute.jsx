import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
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

  return children
}
