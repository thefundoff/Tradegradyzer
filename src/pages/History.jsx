import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScanLine } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import ConfidenceBadge from '../components/ui/ConfidenceBadge'
import PageTransition from '../components/ui/PageTransition'
import { useAuthStore } from '../store/authStore'
import { listAnalyses } from '../lib/analyses'

export default function History() {
  const { user } = useAuthStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listAnalyses(user.id, 100)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">History</h1>
          <Button>
            <Link to="/analyze" className="flex items-center gap-2">
              <ScanLine size={18} /> New
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass shimmer h-28 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <p className="text-white/55">Your analyzed setups will appear here.</p>
            <Button className="mt-4">
              <Link to="/analyze">Analyze a chart</Link>
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link to={`/analysis/${a.id}`}>
                  <GlassCard hover className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-semibold">{a.pair || 'Untitled setup'}</p>
                      <p className="text-xs text-white/45">{new Date(a.created_at).toLocaleString()}</p>
                      <p className="mt-2 text-sm">
                        Score <span className="font-semibold">{a.score}%</span> ·{' '}
                        <span className="capitalize text-white/60">{a.bias}</span>
                      </p>
                      <OutcomeChip outcome={a.outcome} rr={a.outcome_rr} />
                    </div>
                    <ConfidenceBadge grade={a.confidence} />
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}

function OutcomeChip({ outcome, rr }) {
  const map = {
    win: { label: 'Win', color: '#4ade80' },
    loss: { label: 'Loss', color: '#ff5c5c' },
    breakeven: { label: 'Break-even', color: '#f5c451' },
  }
  if (!outcome || outcome === 'pending') {
    return (
      <span className="mt-2 inline-block rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-white/45">
        Outcome pending — tap to log
      </span>
    )
  }
  const m = map[outcome] || map.breakeven
  return (
    <span
      className="mt-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: m.color, background: `${m.color}1a`, border: `1px solid ${m.color}40` }}
    >
      {m.label}
      {rr != null && rr !== '' ? ` · ${rr}R` : ''}
    </span>
  )
}
