import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Check } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import { updateOutcome } from '../lib/analyses'

const OPTIONS = [
  { id: 'win', label: 'Win', icon: TrendingUp, color: '#4ade80' },
  { id: 'loss', label: 'Loss', icon: TrendingDown, color: '#ff5c5c' },
  { id: 'breakeven', label: 'Break-even', icon: Minus, color: '#f5c451' },
]

export default function OutcomeTracker({ row, onSaved }) {
  const [outcome, setOutcome] = useState(row.outcome && row.outcome !== 'pending' ? row.outcome : null)
  const [rr, setRr] = useState(row.outcome_rr ?? '')
  const [note, setNote] = useState(row.outcome_note ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const logged = row.outcome && row.outcome !== 'pending'

  const save = async () => {
    if (!outcome) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateOutcome(row.id, { outcome, rr, note })
      setSaved(true)
      onSaved?.(updated)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">How did it play out?</p>
          <p className="text-sm text-white/50">
            Logging the result trains the AI to grade <span className="text-white/70">your</span> setups
            more accurately over time.
          </p>
        </div>
        {logged && (
          <span className="rounded-md border border-[var(--color-border-hover)] bg-white/5 px-2 py-1 text-xs capitalize text-white/70">
            Logged: {row.outcome}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const active = outcome === o.id
          return (
            <motion.button
              key={o.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOutcome(o.id)}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors"
              style={{
                color: active ? o.color : 'rgba(255,255,255,0.7)',
                borderColor: active ? `${o.color}66` : 'var(--color-border)',
                background: active ? `${o.color}1a` : 'transparent',
              }}
            >
              <o.icon size={16} /> {o.label}
            </motion.button>
          )
        })}
      </div>

      {outcome && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">R multiple achieved (optional)</label>
            <input
              type="number"
              step="0.1"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              placeholder="e.g. 2.5  (or -1 for a full stop-out)"
              className="rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-subtle)] px-3 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">What happened? (optional — the AI learns from this)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Entered too early, price swept the low first then ran."
              className="resize-none rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-subtle)] px-3 py-2.5 text-sm text-white placeholder-white/35 outline-none focus:border-[var(--color-accent)]/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />} {logged ? 'Update outcome' : 'Save outcome'}
            </Button>
            {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
          </div>
        </motion.div>
      )}
    </GlassCard>
  )
}
