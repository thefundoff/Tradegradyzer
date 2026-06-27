import { Link } from 'react-router-dom'
import { LineChart } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import PageTransition from '../ui/PageTransition'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <PageTransition className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]">
            <LineChart size={20} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">TradeGradyzer</span>
        </Link>

        <GlassCard strong className="p-7">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </GlassCard>

        {footer && <div className="mt-5 text-center text-sm text-white/55">{footer}</div>}
      </div>
    </PageTransition>
  )
}
