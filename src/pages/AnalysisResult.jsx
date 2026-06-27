import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Target, ShieldX, TrendingUp, AlertTriangle, Brain, X } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import ScoreRing from '../components/ui/ScoreRing'
import ConfidenceBadge from '../components/ui/ConfidenceBadge'
import ChartViewer from '../components/ChartViewer'
import ShareBar from '../components/ShareBar'
import OutcomeTracker from '../components/OutcomeTracker'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import { CONFIDENCE } from '../lib/constants'
import { getAnalysis, getPerformance } from '../lib/analyses'
import { normTf } from '../lib/timeframe'
import { useAuthStore } from '../store/authStore'

const biasColor = { bullish: 'text-emerald-400', bearish: 'text-red-400', neutral: 'text-amber-300' }

const readabilityNote = {
  busy: 'Cluttered chart — levels read from price action, trader drawings treated as opinion.',
  unreadable: 'Too cluttered to read reliably — upload a cleaner (naked candlestick) screenshot.',
}

// Build the per-grade calibration note shown under the grade on the result page.
function buildCalNote(grade, stat) {
  const { winRate, wins, total } = stat
  const sample = total < 3 ? ' (small sample so far)' : ''
  let advice
  let color
  if (winRate >= 70) {
    advice = `Your ${grade} setups have been reliable — this aligns with your edge.`
    color = '#4ade80'
  } else if (winRate >= 50) {
    advice = `Your ${grade} setups are roughly a coin-flip — manage risk and wait for confirmation.`
    color = '#f5c451'
  } else {
    advice = `Heads up: your ${grade} setups have underperformed — be selective and tighten risk.`
    color = '#ff5c5c'
  }
  return {
    color,
    text: `Calibration: your ${grade} setups historically win ${winRate}% (${wins}/${total})${sample}. ${advice}`,
  }
}

export default function AnalysisResult() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const [row, setRow] = useState(null)
  const [perf, setPerf] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAnalysis(id)
      .then(setRow)
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (!user) return
    getPerformance(user.id)
      .then(setPerf)
      .catch(() => {})
  }, [user])

  if (error) {
    return (
      <PageTransition>
        <GlassCard className="p-8 text-center">
          <p className="text-red-400">{error}</p>
          <Link to="/history" className="mt-3 inline-block text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
            Back to history
          </Link>
        </GlassCard>
      </PageTransition>
    )
  }

  if (!row) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  const r = row.result || {}
  const tfList = r.timeframes || []
  const images = row.images || {}

  // Per-grade calibration note from the user's own logged outcomes.
  const grade = r.confidence || row.confidence
  const gradeStat = perf?.perGrade?.find((g) => g.grade === grade)
  const calNote = gradeStat && gradeStat.total > 0 ? buildCalNote(grade, gradeStat) : null

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/history" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Verdict */}
        <GlassCard strong className="p-5 sm:p-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-6 sm:text-left">
            <ScoreRing score={r.overallScore || row.score} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-white/40">{row.pair || 'Setup'}</p>
              <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <ConfidenceBadge grade={r.confidence || row.confidence} size="lg" />
                <div>
                  <p className="font-semibold">{CONFIDENCE[r.confidence || row.confidence]?.desc}</p>
                  <p className={`text-sm font-medium capitalize ${biasColor[r.bias] || 'text-white/60'}`}>
                    {r.bias || 'neutral'} bias
                  </p>
                </div>
              </div>
            </div>
          </div>

          {calNote && (
            <div
              className="mt-5 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: `${calNote.color}44`, background: `${calNote.color}12` }}
            >
              <Brain size={16} className="mt-0.5 shrink-0" style={{ color: calNote.color }} />
              <span className="text-white/80">{calNote.text}</span>
            </div>
          )}

          {r.summary && <p className="mt-6 text-sm leading-relaxed text-white/70">{r.summary}</p>}

          {r.warnings?.length > 0 && (
            <div className="mt-4 space-y-2">
              {r.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {w}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Outcome tracking — feeds the AI's per-user calibration */}
        <OutcomeTracker row={row} onSaved={(updated) => setRow(updated)} />

        {/* Share */}
        <ShareBar row={row} />

        {/* Trade plan */}
        <div className="grid gap-4 sm:grid-cols-3">
          <PlanCard icon={Target} color="text-white" label="Entry"
            value={r.entry?.price != null ? r.entry.price : '—'}
            sub={r.entry?.type ? `${r.entry.type} · ${r.entry.rationale || ''}` : r.entry?.rationale} />
          <PlanCard icon={ShieldX} color="text-red-400" label="Stop loss"
            value={r.stopLoss ?? '—'} sub="Invalidation level" />
          <PlanCard icon={TrendingUp} color="text-emerald-400" label="Take profit"
            value={r.takeProfit ?? '—'}
            sub={r.riskReward ? `R:R ≈ ${r.riskReward}` : 'Target'} />
        </div>

        {/* Per-timeframe */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold">Timeframe breakdown</h2>
          {tfList.length === 0 && <p className="text-sm text-white/50">No per-timeframe detail returned.</p>}
          {tfList.map((tf, i) => (
            <motion.div
              key={tf.timeframe || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {(() => {
                const mismatch =
                  tf.detectedTimeframe &&
                  tf.detectedTimeframe.toLowerCase() !== 'unknown' &&
                  normTf(tf.detectedTimeframe) !== normTf(tf.timeframe)
                const note = readabilityNote[tf.readability]
                return (
              <GlassCard className="overflow-hidden p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="grid h-8 w-12 place-items-center rounded-lg bg-white/10 text-xs font-bold uppercase">
                    {tf.timeframe}
                  </span>
                  <span className={`text-sm font-medium capitalize ${biasColor[tf.trend] || 'text-white/60'}`}>
                    {tf.trend || ''}
                  </span>
                  {mismatch && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
                      <AlertTriangle size={12} /> Labeled {tf.timeframe} · looks like {tf.detectedTimeframe}
                    </span>
                  )}
                  {tf.readability === 'unreadable' && (
                    <span className="rounded-md border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs text-red-200">
                      Unreadable
                    </span>
                  )}
                  {tf.readability === 'busy' && (
                    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/60">
                      Cluttered
                    </span>
                  )}
                </div>
                {note && <p className="mb-3 text-xs text-white/50">{note}</p>}

                <div className="grid gap-4 md:grid-cols-2">
                  {images[tf.timeframe] ? (
                    <ChartViewer
                      src={images[tf.timeframe]}
                      tfData={tf}
                      onClick={() => setZoom({ src: images[tf.timeframe], tf })}
                    />
                  ) : (
                    <div className="grid aspect-video place-items-center rounded-2xl bg-white/5 text-sm text-white/40">
                      No image saved
                    </div>
                  )}

                  <div className="space-y-3">
                    {tf.comment && <p className="text-sm leading-relaxed text-white/70">{tf.comment}</p>}
                    {tf.keyLevels?.length > 0 && (
                      <div className="space-y-1.5">
                        {tf.keyLevels.map((lvl, j) => (
                          <div key={j} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  background:
                                    lvl.type === 'resistance' ? '#f87171' : lvl.type === 'support' ? '#34d399' : '#fbbf24',
                                }}
                              />
                              <span className="capitalize text-white/70">{lvl.label || lvl.type}</span>
                            </span>
                            <span className="font-medium text-white/85">{lvl.price ?? ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
                )
              })()}
            </motion.div>
          ))}
        </div>

        <p className="pb-4 text-center text-xs text-white/35">
          TradeGradyzer is an educational tool. Always do your own research — this is not financial advice.
        </p>
      </div>

      {/* Chart lightbox — view the marked zones / key levels enlarged */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setZoom(null)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            >
              <p className="mb-2 text-center text-xs uppercase tracking-widest text-white/50">
                {zoom.tf?.timeframe} · marked zones & key levels
              </p>
              <ChartViewer src={zoom.src} tfData={zoom.tf} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function PlanCard({ icon: Icon, color, label, value, sub }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2">
        <Icon size={18} className={color} />
        <span className="text-xs uppercase tracking-widest text-white/40">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
    </GlassCard>
  )
}
