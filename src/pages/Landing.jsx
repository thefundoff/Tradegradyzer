import { lazy, Suspense, Component } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, ScanLine, Target, Gauge, Layers, ShieldCheck, ArrowRight } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import PageTransition from '../components/ui/PageTransition'
import { useAuthStore } from '../store/authStore'
import { LEGAL_LINKS } from '../lib/legal'

// three.js scene is heavy — load it lazily so it never blocks first paint.
const HeroScene = lazy(() => import('../components/HeroScene'))

const features = [
  { icon: Layers, title: 'Multi-timeframe', desc: 'Upload 4H, 1H and 30M charts for a top-down read of your setup.' },
  { icon: Target, title: 'Key levels & entry', desc: 'AI marks support, resistance and an optimal entry directly on your chart.' },
  { icon: Gauge, title: 'Setup score', desc: 'Every setup graded 10–100% so you only take the highest-probability trades.' },
  { icon: ShieldCheck, title: 'Confidence grade', desc: 'A clear A+, B, C or F rating tells you when to act and when to wait.' },
]

// Shown while the 3D scene loads and as the no-WebGL fallback.
function StaticHeroCard() {
  return (
    <GlassCard strong className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">Setup score</p>
          <p className="text-5xl font-bold text-emerald-400">87%</p>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-2xl font-extrabold text-emerald-400">
          A+
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {[
          ['4H', 'Bullish structure, HTF demand'],
          ['1H', 'Break & retest confirmed'],
          ['30M', 'Entry at order block'],
        ].map(([tf, txt]) => (
          <div key={tf} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="grid h-7 w-9 place-items-center rounded-md bg-white/10 text-[11px] font-bold">{tf}</span>
            <span className="text-sm text-white/70">{txt}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

// If WebGL is unavailable or the scene errors, fall back to the static card.
class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

export default function Landing() {
  const user = useAuthStore((s) => s.user)

  return (
    <PageTransition>
      <div className="relative mx-auto w-full max-w-6xl px-5 py-6">
        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)]">
              <LineChart size={18} className="text-black" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">TradeGradyzer</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button as={Link} to="/dashboard" size="sm">
                <Link to="/dashboard" className="flex items-center gap-2">
                  Dashboard <ArrowRight size={16} />
                </Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm text-white/70 hover:text-white">
                  Log in
                </Link>
                <Button size="sm">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <section className="relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          {/* Aurora glows behind the hero */}
          <div className="pointer-events-none absolute inset-0 -z-0 overflow-visible">
            <div className="aurora left-[-6%] top-[2%] h-72 w-72" style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.40), transparent 70%)' }} />
            <div className="aurora right-[2%] top-[18%] h-80 w-80" style={{ background: 'radial-gradient(circle, rgba(94,139,255,0.32), transparent 70%)', animationDelay: '-5s' }} />
            <div className="aurora bottom-[-10%] left-[28%] h-64 w-64" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.26), transparent 70%)', animationDelay: '-9s' }} />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              <ScanLine size={14} className="text-white/80" /> AI-powered chart analysis
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-4xl font-extrabold leading-tight md:text-6xl"
            >
              Grade your trade <span className="text-gradient">before</span> you take it.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-md text-white/60"
            >
              Upload your 4H, 1H and 30M charts. TradeGradyzer's AI marks your key levels, scores the
              setup and pinpoints a clean entry — tuned to how you trade.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button size="lg">
                <Link to={user ? '/analyze' : '/signup'} className="flex items-center gap-2">
                  Analyze a chart <ArrowRight size={18} />
                </Link>
              </Button>
              <Button as="div" variant="ghost" size="lg">
                <Link to="/pricing">View pricing</Link>
              </Button>
            </motion.div>
          </div>

          {/* 3D candlestick scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 110 }}
            className="relative z-10 h-[320px] sm:h-[400px] md:h-[440px]"
          >
            {/* Floating setup chips over the scene */}
            <div className="float-y pointer-events-none absolute -left-2 top-4 z-20 hidden rounded-xl border border-[var(--color-accent)]/30 bg-black/55 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:block" style={{ animationDelay: '-1s' }}>
              FVG ✓
            </div>
            <div className="float-y pointer-events-none absolute right-0 top-1/3 z-20 hidden rounded-xl border border-emerald-400/30 bg-black/55 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:block" style={{ animationDelay: '-3s' }}>
              Order Block ✓
            </div>
            <div className="float-y pointer-events-none absolute bottom-2 left-8 z-20 hidden rounded-xl border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold backdrop-blur sm:block" style={{ animationDelay: '-2s' }}>
              R:R ≈ 2.6
            </div>

            <SceneBoundary fallback={<div className="grid h-full place-items-center"><StaticHeroCard /></div>}>
              <Suspense fallback={<div className="grid h-full place-items-center"><StaticHeroCard /></div>}>
                <HeroScene />
              </Suspense>
            </SceneBoundary>
          </motion.div>
        </section>

        {/* Features */}
        <section className="relative z-10 grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6 }}
            >
              <GlassCard hover className="h-full p-5">
                <f.icon size={22} className="text-white/80" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-white/55">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        <footer className="mt-12 border-t border-white/10 py-8 text-sm text-white/40">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="text-white/55 transition-colors hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-5 text-center">
            © {new Date().getFullYear()} TradeGradyzer · Not financial advice. For educational use.
          </p>
        </footer>
      </div>
    </PageTransition>
  )
}
