import { motion } from 'framer-motion'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none'

const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

const variants = {
  // Gold button, dark text — the primary CTA
  primary: 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]',
  // Bordered, transparent — secondary action
  ghost: 'bg-transparent text-[var(--color-fg)] border border-[var(--color-border-hover)] hover:bg-white/5 hover:border-[var(--color-accent)]/40',
  outline: 'bg-transparent text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-white/5',
  danger: 'bg-[#ff5c5c] text-black hover:bg-[#ff7070]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Tag = 'button',
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
