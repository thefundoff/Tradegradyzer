import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, ScanLine, Target, Gauge, Layers, ShieldCheck, ArrowRight } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import PageTransition from '../components/ui/PageTransition'
import { useAuthStore } from '../store/authStore'

const features = [
  { icon: Layers, title: 'Multi-timeframe', desc: 'Upload 4H, 1H and 30M charts for a top-down read of your setup.' },
  { icon: Target, title: 'Key levels & entry', desc: 'AI marks support, resistance and an optimal entry directly on your chart.' },
  { icon: Gauge, title: 'Setup score', desc: 'Every setup graded 10–100% so you only take the highest-probability trades.' },
  { icon: ShieldCheck, title: 'Confidence grade', desc: 'A clear A+, B, C or F rating tells you when to act and when to wait.' },
]

export default function Landing() {
  const user = useAuthStore((s) => s.user)

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-5 py-6">
        {/* Nav */}
        <header className="flex items-center justify-between py-2">
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
        <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div>
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
              setup and pinpoints a clean entry — in seconds.
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          >
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
                    <span className="grid h-7 w-9 place-items-center rounded-md bg-white/10 text-[11px] font-bold">
                      {tf}
                    </span>
                    <span className="text-sm text-white/70">{txt}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* Features */}
        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard hover className="h-full p-5">
                <f.icon size={22} className="text-white/80" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-white/55">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        <footer className="mt-12 border-t border-white/10 py-8 text-center text-sm text-white/40">
          © {new Date().getFullYear()} TradeGradyzer · Not financial advice. For educational use.
        </footer>
      </div>
    </PageTransition>
  )
}
