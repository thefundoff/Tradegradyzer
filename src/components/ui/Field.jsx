import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Field({ label, type = 'text', icon: Icon, ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  const leftPad = Icon ? 'pl-11' : 'pl-4'
  const rightPad = isPassword ? 'pr-11' : 'pr-4'

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-white/75">{label}</span>}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        )}
        <input
          type={inputType}
          className={`w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-subtle)] py-2.5 text-sm text-[var(--color-fg)] placeholder-[var(--color-faint)] outline-none transition focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/25 ${leftPad} ${rightPad}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-white/40 transition-colors hover:text-white"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  )
}
