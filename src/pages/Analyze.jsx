import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, Lock, Plus, X, AlertTriangle } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import ChartUploader from '../components/ChartUploader'
import AnalyzingProgress from '../components/AnalyzingProgress'
import PageTransition from '../components/ui/PageTransition'
import {
  TIMEFRAME_OPTIONS,
  DEFAULT_TF_SLOTS,
  MAX_TF_SLOTS,
  MIN_TF_SLOTS,
} from '../lib/constants'
import { analyzeCharts } from '../lib/analyzer'
import { saveAnalysis, getCalibration } from '../lib/analyses'
import { matchOption } from '../lib/timeframe'
import { useAuthStore } from '../store/authStore'

let _slotId = 0
const newSlot = (tf) => ({ id: ++_slotId, tf, file: null })

export default function Analyze() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [slots, setSlots] = useState(() => DEFAULT_TF_SLOTS.map(newSlot))
  const [pair, setPair] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [error, setError] = useState('')
  const [gate, setGate] = useState(null)
  const [mismatches, setMismatches] = useState(null)

  const usedTfs = slots.map((s) => s.tf)
  const hasAny = slots.some((s) => s.file)

  const setSlotTf = (id, tf) =>
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, tf } : s)))
  const setSlotFile = (id, file) =>
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, file } : s)))
  const removeSlot = (id) =>
    setSlots((prev) => (prev.length > MIN_TF_SLOTS ? prev.filter((s) => s.id !== id) : prev))
  const addSlot = () => {
    const free = TIMEFRAME_OPTIONS.find((t) => !usedTfs.includes(t))
    if (free && slots.length < MAX_TF_SLOTS) setSlots((prev) => [...prev, newSlot(free)])
  }

  // Switch the slot currently labelled `slotTf` to the AI's detected timeframe.
  const applyDetected = (slotTf, detected) => {
    const opt = matchOption(detected, TIMEFRAME_OPTIONS)
    if (!opt) return
    // Avoid colliding with another slot already using that timeframe.
    if (usedTfs.includes(opt) && opt !== slotTf) return
    setSlots((prev) => prev.map((s) => (s.tf === slotTf ? { ...s, tf: opt } : s)))
    setMismatches((prev) => {
      const next = (prev || []).filter((m) => m.slot !== slotTf)
      return next.length ? next : null
    })
  }

  // Build the { tf: File } map for the analyzer (timeframes are unique per slot).
  const buildFiles = () => {
    const out = {}
    slots.forEach((s) => {
      if (s.file) out[s.tf] = s.file
    })
    return out
  }

  const run = async () => {
    setError('')
    if (!hasAny) {
      setError('Upload at least one chart to analyze.')
      return
    }

    setComplete(false)
    setSavedId(null)
    setLoading(true)
    try {
      // Free-tier limit + subscription are enforced server-side in the edge
      // function (returns status: 'limit_reached'), so no client pre-check.
      const files = buildFiles()
      // Feed the AI this trader's own grade-vs-outcome history so it self-calibrates.
      const calibration = await getCalibration(user.id).catch(() => null)
      const result = await analyzeCharts(files, { pair, notes, calibration })

      // Blocked: a chart's real timeframe doesn't match its slot — ask the
      // user to fix the dropdown rather than producing a misleading grade.
      if (result?.status === 'timeframe_mismatch') {
        setMismatches(result.mismatches || [])
        setLoading(false)
        return
      }
      // Server-enforced quota (free 1/day, weekly 15, monthly 60).
      if (result?.status === 'limit_reached') {
        setGate(result)
        setLoading(false)
        return
      }
      // Per-user rate limit.
      if (result?.status === 'rate_limited') {
        setError("You're analyzing too fast — wait a few seconds and try again.")
        setLoading(false)
        return
      }

      const saved = await saveAnalysis({ userId: user.id, pair, notes, files, result })
      // Let the progress bar finish to 100% before we leave; the overlay's
      // onDone (below) handles navigation, so we keep `loading` true here.
      setSavedId(saved.id)
      setComplete(true)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analyze a setup</h1>
          <p className="mt-1 text-white/55">
            Upload your charts top-down. More timeframes = a more confident grade.
          </p>
        </div>

        <GlassCard className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <div key={slot.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 px-1">
                  <select
                    value={slot.tf}
                    onChange={(e) => setSlotTf(slot.id, e.target.value)}
                    className="rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-subtle)] px-2.5 py-1.5 text-sm font-semibold text-white outline-none transition focus:border-[var(--color-accent)]/50"
                  >
                    {TIMEFRAME_OPTIONS.map((opt) => (
                      <option
                        key={opt}
                        value={opt}
                        disabled={opt !== slot.tf && usedTfs.includes(opt)}
                        className="bg-black"
                      >
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {slots.length > MIN_TF_SLOTS && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="Remove timeframe"
                      title="Remove timeframe"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <ChartUploader
                  badge={slot.tf}
                  file={slot.file}
                  onChange={(f) => setSlotFile(slot.id, f)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/45">
              Pick the timeframe per slot (high → low). The AI verifies the actual timeframe, flags
              mismatches, and reads cleaner (naked candlestick) charts most accurately.
            </p>
            {slots.length < MAX_TF_SLOTS && usedTfs.length < TIMEFRAME_OPTIONS.length && (
              <Button variant="ghost" size="sm" onClick={addSlot} disabled={loading}>
                <Plus size={15} /> Add timeframe
              </Button>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              label="Pair / asset (optional)"
              placeholder="e.g. BTC/USDT, EUR/USD"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
            />
            <Field
              label="Notes for the AI (optional)"
              placeholder="e.g. looking for longs only"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <AlertTriangle size={13} className="shrink-0" /> Educational use only. Not financial advice.
            </p>
            <Button size="lg" onClick={run} disabled={loading || !hasAny}>
              <ScanLine size={18} /> {loading ? 'Analyzing…' : 'Analyze setup'}
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Analyzing overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
          >
            <AnalyzingProgress
              complete={complete}
              onDone={() => savedId && navigate(`/analysis/${savedId}`)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quota gate */}
      <AnimatePresence>
        {gate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
          >
            <GlassCard strong className="max-w-sm p-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border-hover)] bg-white/5 text-white">
                <Lock size={26} />
              </div>
              {gate.reason === 'plan_quota' ? (
                <>
                  <h2 className="text-xl font-bold">Plan limit reached</h2>
                  <p className="mt-2 text-sm text-white/60">
                    You've used all {gate.limit} analyses on your {gate.plan} plan this{' '}
                    {gate.days === 7 ? 'week' : 'month'}. It resets as your usage rolls over
                    {gate.plan === 'weekly' ? ', or upgrade to Monthly for 60.' : '.'}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">Daily free limit reached</h2>
                  <p className="mt-2 text-sm text-white/60">
                    You've used your free analysis for today. Subscribe for more, or come back
                    tomorrow.
                  </p>
                </>
              )}
              <div className="mt-6 flex flex-col gap-2">
                {!(gate.reason === 'plan_quota' && gate.plan === 'monthly') && (
                  <Button>
                    <Link to="/pricing">{gate.reason === 'plan_quota' ? 'Upgrade plan' : 'See plans'}</Link>
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setGate(null)}>
                  {gate.reason === 'plan_quota' && gate.plan === 'monthly' ? 'Got it' : 'Maybe later'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeframe mismatch — block & instruct */}
      <AnimatePresence>
        {mismatches && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
          >
            <GlassCard strong className="max-w-md p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Timeframe doesn't match</h2>
                  <p className="text-sm text-white/55">Fix the dropdown so we can analyze it properly.</p>
                </div>
              </div>

              <div className="space-y-2">
                {mismatches.map((m) => {
                  const opt = matchOption(m.detected, TIMEFRAME_OPTIONS)
                  return (
                    <div
                      key={m.slot}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white/5 px-3 py-2.5"
                    >
                      <p className="text-sm text-white/80">
                        Your <span className="font-semibold">{m.slot.toUpperCase()}</span> slot looks like a{' '}
                        <span className="font-semibold">{String(m.detected).toUpperCase()}</span> chart.
                        {opt
                          ? ` Select ${opt.toUpperCase()} for proper analysis.`
                          : ' Pick the matching timeframe in the dropdown.'}
                      </p>
                      {opt && (!usedTfs.includes(opt) || opt === m.slot) && (
                        <Button size="sm" onClick={() => applyDetected(m.slot, m.detected)}>
                          Set {opt.toUpperCase()}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="ghost" onClick={() => setMismatches(null)}>
                  Got it
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
