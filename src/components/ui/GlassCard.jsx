import { motion } from 'framer-motion'

export default function GlassCard({
  children,
  className = '',
  strong = false,
  hover = false,
  ...props
}) {
  return (
    <motion.div
      className={`${strong ? 'glass-strong' : 'glass'} transition-colors duration-200 ${
        hover ? 'hover:border-[var(--color-border-hover)] hover:bg-[var(--color-card-hover)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
