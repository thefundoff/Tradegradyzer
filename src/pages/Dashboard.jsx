import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScanLine, LineChart, TrendingUp, Crown, ArrowRight } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import ConfidenceBadge from '../components/ui/ConfidenceBadge'
import PageTransition from '../components/ui/PageTransition'
import AdminPanel from '../components/AdminPanel'
import { useAuthStore } from '../store/authStore'
import { listAnalyses, getPerformance, getRemainingQuota } from '../lib/analyses'
import { CONFIDENCE } from '../lib/constants'

export default function Dashboard() {
  const { user, profile, isSubscribed } = useAuthStore()
  const [items, setItems] = useState([])
  const [perf, setPerf] = useState(null)
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(true)

  const subscribed = isSubscribed()
  const planKey = subscribed ? profile?.subscription_plan || 'monthly' : 'free'

  useEffect(() => {
    if (!user) return
    Promise.all([listAnalyses(user.id, 5), getPerformance(user.id), getRemainingQuota(user.id, planKey)])
      .then(([list, performance, q]) => {
        setItems(list)
        setPerf(performance)
        setQuota(q)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, planKey])

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Trader'
  const canceled = profile?.subscription_status === 'canceled'
  const expiryDate = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString()
    : null
  const used = items.length
  const avg = items.length
    ? Math.round(items.reduce((a, b) => a + (b.score || 0), 0) / items.length)
    : 0

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-white/50">Welcome back,</p>
            <h1 className="text-3xl font-bold">{name} 👋</h1>
          </div>
          <Button>
            <Link to="/analyze" className="flex items-center gap-2">
              <ScanLine size={18} /> New analysis
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={LineChart} label="Analyses" value={used} />
          <StatCard icon={TrendingUp} label="Avg. score" value={avg ? `${avg}%` : '—'} />
          <GlassCard className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Plan</p>
              <p className="mt-1 text-xl font-bold capitalize">
                {subscribed ? profile?.subscription_plan || 'Pro' : 'Free'}
              </p>
              {subscribed && canceled ? (
                <p className="mt-0.5 text-xs text-amber-300/80">Canceled · ends {expiryDate}</p>
              ) : (
                quota && (
                  <p className="mt-0.5 text-xs text-white/45">
                    {quota.remaining}/{quota.limit} left this {quota.label}
                  </p>
                )
              )}
            </div>
            <Crown size={22} className={subscribed ? 'text-[var(--color-accent)]' : 'text-white/30'} />
          </GlassCard>
        </div>

        {!subscribed && (
          <GlassCard strong className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">You're on the Free plan</p>
              <p className="text-sm text-white/55">
                {quota ? `${quota.remaining} of ${quota.limit}` : '1'} free analysis left today.
                Subscribe for 15/week or 60/month.
              </p>
            </div>
            <Button>
              <Link to="/pricing" className="flex items-center gap-2">
                Upgrade <ArrowRight size={16} />
              </Link>
            </Button>
          </GlassCard>
        )}

        {/* Admin — owner-only view of subscribers + waitlist */}
        {profile?.is_admin && <AdminPanel />}

        {/* Performance — outcome tracking + AI calibration */}
        <PerformancePanel perf={perf} loading={loading} />

        {/* Recent */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent analyses</h2>
            <Link to="/history" className="text-sm text-white/60 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="glass shimmer h-24 rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-white/55">No analyses yet.</p>
              <Button className="mt-4">
                <Link to="/analyze">Analyze your first chart</Link>
              </Button>
            </GlassCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/analysis/${a.id}`}>
                    <GlassCard hover className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold">{a.pair || 'Untitled setup'}</p>
                        <p className="text-xs text-white/45">
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-white/60">Score {a.score}%</p>
                      </div>
                      <ConfidenceBadge grade={a.confidence} size="sm" />
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <GlassCard className="flex items-center justify-between p-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
      <Icon size={22} className="text-white/50" />
    </GlassCard>
  )
}

function PerformancePanel({ perf, loading }) {
  if (loading) return <div className="glass shimmer h-32 rounded-2xl" />
  if (!perf || perf.decided === 0) {
    return (
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">Track your results to train the AI</p>
          <p className="text-sm text-white/55">
            Log how each setup plays out. The AI uses your win-rate by grade to calibrate future analyses.
          </p>
        </div>
        <Button variant="ghost">
          <Link to="/history">Log an outcome</Link>
        </Button>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your performance</h2>
        <span className="text-xs text-white/45">{perf.decided} setups logged</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Win rate" value={perf.winRate != null ? `${perf.winRate}%` : '—'} />
        <Metric label="Wins" value={perf.wins} />
        <Metric label="Losses" value={perf.losses} />
        <Metric label="Avg R" value={perf.avgRr != null ? `${perf.avgRr}R` : '—'} />
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/40">Win rate by grade</p>
        {perf.perGrade
          .filter((g) => g.total > 0)
          .map((g) => (
            <div key={g.grade} className="flex items-center gap-3">
              <span
                className="w-8 text-sm font-bold"
                style={{ color: CONFIDENCE[g.grade]?.color }}
              >
                {g.grade}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${g.winRate ?? 0}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: CONFIDENCE[g.grade]?.color }}
                />
              </div>
              <span className="w-20 text-right text-xs text-white/55">
                {g.winRate ?? 0}% · {g.wins}/{g.total}
              </span>
            </div>
          ))}
      </div>
    </GlassCard>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}
