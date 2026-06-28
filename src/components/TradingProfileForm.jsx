import { Check } from 'lucide-react'
import { TRADER_STYLES, TRADE_SETUPS, RISK_APPETITES, MARKETS } from '../lib/constants'

/**
 * The trader-profile questionnaire. Controlled: `value` is
 * { style, setups[], risk, markets[] } and `onChange` returns the next value.
 * Reused by Signup (step 2), the /onboarding gate, and Settings.
 */
export default function TradingProfileForm({ value, onChange, compact = false }) {
  const v = { style: '', setups: [], risk: '', markets: [], ...value }

  const set = (patch) => onChange({ ...v, ...patch })
  const toggle = (key, id) => {
    const arr = v[key] || []
    set({ [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] })
  }

  return (
    <div className={compact ? 'space-y-5' : 'space-y-6'}>
      {/* Trading style — single select */}
      <Group label="What kind of trader are you?">
        <div className="grid grid-cols-2 gap-2">
          {TRADER_STYLES.map((s) => (
            <Choice
              key={s.id}
              active={v.style === s.id}
              onClick={() => set({ style: s.id })}
              title={s.label}
              hint={s.hint}
            />
          ))}
        </div>
      </Group>

      {/* Setups — multi select */}
      <Group label="Which setups do you trade?" sub="Pick all that apply — the AI prioritizes these.">
        <div className="flex flex-wrap gap-2">
          {TRADE_SETUPS.map((s) => (
            <Pill key={s.id} active={(v.setups || []).includes(s.id)} onClick={() => toggle('setups', s.id)}>
              {s.label}
            </Pill>
          ))}
        </div>
      </Group>

      {/* Risk appetite — single select */}
      <Group label="What's your risk appetite?">
        <div className="grid gap-2 sm:grid-cols-3">
          {RISK_APPETITES.map((r) => (
            <Choice
              key={r.id}
              active={v.risk === r.id}
              onClick={() => set({ risk: r.id })}
              title={r.label}
              hint={r.hint}
            />
          ))}
        </div>
      </Group>

      {/* Markets — multi select */}
      <Group label="Which markets do you trade?">
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <Pill key={m.id} active={(v.markets || []).includes(m.id)} onClick={() => toggle('markets', m.id)}>
              {m.label}
            </Pill>
          ))}
        </div>
      </Group>
    </div>
  )
}

function Group({ label, sub, children }) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {sub && <p className="mb-2 mt-0.5 text-xs text-white/45">{sub}</p>}
      <div className={sub ? '' : 'mt-2'}>{children}</div>
    </div>
  )
}

function Choice({ active, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
          : 'border-[var(--color-border-hover)] bg-white/5 hover:border-white/25'
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {hint && <span className="mt-0.5 block text-xs text-white/45">{hint}</span>}
    </button>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-white'
          : 'border-[var(--color-border-hover)] bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
      }`}
    >
      {active && <Check size={13} className="text-[var(--color-accent)]" />}
      {children}
    </button>
  )
}
