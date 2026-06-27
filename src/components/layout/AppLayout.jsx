import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ScanLine,
  History,
  CreditCard,
  Settings,
  LogOut,
  LineChart,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze', icon: ScanLine },
  { to: '/history', label: 'History', icon: History },
  { to: '/pricing', label: 'Plans', icon: CreditCard },
]

export default function AppLayout() {
  const { profile, user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Trader'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 p-4 md:flex">
        <Link to="/" className="mb-4 flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)]">
            <LineChart size={18} className="text-black" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">TradeGradyzer</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="block">
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'glass text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/settings" className="block">
          {({ isActive }) => (
            <div
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'glass text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={18} /> Settings
            </div>
          )}
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex w-full flex-1 flex-col">
        {/* Mobile top bar — padded for the iPhone notch / status bar */}
        <header
          className="flex items-center justify-between px-4 pb-3 md:hidden"
          style={{ paddingTop: 'max(0.85rem, env(safe-area-inset-top))' }}
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent)]">
              <LineChart size={16} className="text-black" />
            </div>
            <span className="font-bold">TradeGradyzer</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              Hi, {name}
              <ChevronDown
                size={14}
                className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="glass-strong absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden p-1"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/settings')
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Settings size={16} /> Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-2 md:px-8 md:pb-10 md:pt-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        className="glass-strong fixed inset-x-3 z-40 flex items-center justify-around rounded-2xl p-1.5 md:hidden"
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-white/45'
                }`}
              >
                <Icon size={20} />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  )
}
