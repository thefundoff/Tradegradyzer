import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LineChart, ArrowLeft } from 'lucide-react'
import PageTransition from '../ui/PageTransition'
import { LEGAL_LINKS, CONTACT_EMAIL, EFFECTIVE_DATE } from '../../lib/legal'

// Shared shell for every policy page: brand header, title + effective date,
// the prose body, and a cross-linking footer. Keeps the five legal documents
// visually consistent and in sync.
export default function LegalLayout({ title, subtitle, children }) {
  const { pathname } = useLocation()

  // Long documents — always start the reader at the top when navigating in.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl px-5 py-6">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)]">
              <LineChart size={18} className="text-black" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">TradeGradyzer</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={15} /> Home
          </Link>
        </header>

        {/* Title */}
        <div className="mt-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-white/55">{subtitle}</p>}
          <p className="mt-3 text-xs uppercase tracking-widest text-white/35">
            Last updated · {EFFECTIVE_DATE}
          </p>
        </div>

        {/* Body */}
        <article className="legal-prose mt-8">{children}</article>

        {/* Footer / cross-links */}
        <footer className="mt-16 border-t border-white/10 pt-8">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LEGAL_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="text-white/55 transition-colors hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-5 text-sm text-white/40">
            Questions about this document? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-accent)] hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-3 text-xs text-white/35">
            © {new Date().getFullYear()} TradeGradyzer · AI-assisted chart analysis. Not financial
            advice. For educational use only.
          </p>
        </footer>
      </div>
    </PageTransition>
  )
}
