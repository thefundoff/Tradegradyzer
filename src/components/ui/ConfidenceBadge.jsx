import { motion } from 'framer-motion'
import { CONFIDENCE } from '../../lib/constants'

export default function ConfidenceBadge({ grade = 'C', size = 'md' }) {
  const meta = CONFIDENCE[grade] || CONFIDENCE.C
  const dims = size === 'lg' ? 'h-20 w-20 text-3xl' : size === 'sm' ? 'h-9 w-9 text-sm' : 'h-14 w-14 text-xl'

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
      className={`flex items-center justify-center rounded-2xl font-extrabold ${dims}`}
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${meta.color} 45%, transparent)`,
        boxShadow: `0 0 24px -6px ${meta.color}`,
      }}
      title={meta.desc}
    >
      {meta.label}
    </motion.div>
  )
}
