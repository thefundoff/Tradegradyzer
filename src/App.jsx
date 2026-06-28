import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import InstallPrompt from './components/InstallPrompt'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import AnalysisResult from './pages/AnalysisResult'
import History from './pages/History'
import Pricing from './pages/Pricing'
import Settings from './pages/Settings'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const location = useLocation()

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <div className="app-bg" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/analysis/:id" element={<AnalysisResult />} />
            <Route path="/history" element={<History />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <InstallPrompt />
    </>
  )
}
