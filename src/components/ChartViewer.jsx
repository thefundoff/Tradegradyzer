import { motion } from 'framer-motion'
import { Maximize2 } from 'lucide-react'

const lineColor = {
  resistance: '#f87171',
  support: '#34d399',
  pivot: '#fbbf24',
}

/**
 * Renders a chart image with the AI's key levels drawn as horizontal lines.
 * Levels use `yNorm` (0 = top, 1 = bottom) for placement.
 * Pass `onClick` to make it open in a lightbox.
 */
export default function ChartViewer({ src, tfData, onClick }) {
  const levels = tfData?.keyLevels || []
  const entry = tfData?.entryZone

  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 ${
        onClick ? 'cursor-zoom-in' : ''
      }`}
    >
      <img src={src} alt="chart" className="block w-full" />

      {onClick && (
        <div className="pointer-events-none absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-black/55 text-white">
          <Maximize2 size={15} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0">
        {levels.map((lvl, i) => {
          if (lvl.yNorm == null) return null
          const color = lineColor[lvl.type] || '#a855f7'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="absolute left-0 right-0 origin-left"
              style={{ top: `${lvl.yNorm * 100}%` }}
            >
              <div className="h-px w-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span
                className="absolute -top-2.5 right-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ color, background: 'rgba(0,0,0,0.6)' }}
              >
                {lvl.label || lvl.type}
                {lvl.price != null ? ` · ${lvl.price}` : ''}
              </span>
            </motion.div>
          )
        })}

        {entry?.yNorm != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute left-0 right-0"
            style={{ top: `${entry.yNorm * 100}%` }}
          >
            <div
              className="h-0.5 w-full"
              style={{ background: '#ffffff', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}
            />
            <span className="absolute -top-3 left-1 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-accent-fg)]">
              ▶ ENTRY{entry.price != null ? ` · ${entry.price}` : ''}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
