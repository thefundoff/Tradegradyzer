import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import GlassCard from './ui/GlassCard'

// Status lines that cycle while the AI works, to telegraph what's happening.
const STEPS = [
  'Reading your charts…',
  'Detecting timeframe & market structure…',
  'Mapping support & resistance…',
  'Locating supply & demand zones…',
  'Checking trend & momentum…',
  'Weighing risk-to-reward…',
  'Marking entry, stop & target…',
  'Cross-checking your timeframes…',
  'Scoring the setup…',
  'Finalizing your grade…',
]

// The bar sprints to this, then holds until the real result lands.
const HOLD_AT = 78

/**
 * Indeterminate-but-believable progress for the analyze overlay. It races up to
 * ~78% quickly (easing as it nears the cap), waits there for the AI, then fills
 * to 100% once `complete` flips — calling `onDone` after a short beat.
 */
export default function AnalyzingProgress({ complete, onDone }) {
  const [progress, setProgress] = useState(6)
  const [step, setStep] = useState(0)
  const doneFired = useRef(false)

  // Creep toward the hold point while we wait on the AI (fast, then easing).
  useEffect(() => {
    if (complete) return
    const id = setInterval(() => {
      setProgress((p) => (p >= HOLD_AT ? HOLD_AT : Math.min(HOLD_AT, p + Math.max(0.6, (HOLD_AT - p) * 0.08))))
    }, 90)
    return () => clearInterval(id)
  }, [complete])

  // Rotate the status words for the illusion of distinct stages of work.
  useEffect(() => {
    if (complete) return
    const id = setInterval(() => setStep((s) => (s + 1) % (STEPS.length - 1)), 1100)
    return () => clearInterval(id)
  }, [complete])

  // Real result landed: jump to the final line, fill to 100%, then hand off.
  useEffect(() => {
    if (!complete) return
    setStep(STEPS.length - 1)
    setProgress(100)
    const t = setTimeout(() => {
      if (!doneFired.current) {
        doneFired.current = true
        onDone?.()
      }
    }, 650)
    return () => clearTimeout(t)
  }, [complete, onDone])

  const pct = Math.round(progress)

  return (
    <GlassCard strong className="flex w-[min(22rem,90vw)] flex-col items-center gap-5 p-8">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-accent)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="grid place-items-center"
        >
          <Loader2 size={28} className="text-black" />
        </motion.div>
      </div>

      <div className="text-center">
        <p className="font-semibold">Analyzing your setup</p>
        <p className="mt-1 min-h-[1.25rem] text-sm text-white/55 transition-opacity">
          {complete ? 'Done — opening your grade…' : STEPS[step]}
        </p>
      </div>

      <div className="w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/45">
          <span>{complete ? 'Complete' : 'Working…'}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      </div>
    </GlassCard>
  )
}
