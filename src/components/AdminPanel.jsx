import { useEffect, useState } from 'react'
import { Crown, Users, Clock, Mail } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import { getSubscribers, getWaitlist } from '../lib/admin'

const PLAN_GROUPS = [
  { id: 'lifetime', label: 'Lifetime', icon: Crown },
  { id: 'monthly', label: 'Monthly', icon: Users },
  { id: 'weekly', label: 'Weekly', icon: Users },
]

export default function AdminPanel() {
  const [subs, setSubs] = useState(null)
  const [waitlist, setWaitlist] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getSubscribers(), getWaitlist()])
      .then(([s, w]) => {
        setSubs(s)
        setWaitlist(w)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <GlassCard className="p-5">
        <p className="text-sm text-red-400">Admin data unavailable: {error}</p>
      </GlassCard>
    )
  }

  const loading = subs == null || waitlist == null
  const byPlan = (plan) => (subs || []).filter((s) => s.plan === plan)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown size={18} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-semibold">Customers</h2>
        <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs text-[var(--color-accent)]">
          Admin
        </span>
      </div>

      {loading ? (
        <div className="glass shimmer h-40 rounded-2xl" />
      ) : (
        <>
          {/* Summary chips */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLAN_GROUPS.map((g) => (
              <SummaryChip key={g.id} icon={g.icon} label={g.label} value={byPlan(g.id).length} />
            ))}
            <SummaryChip icon={Clock} label="Waitlist" value={waitlist.length} />
          </div>

          {/* Subscriber lists per plan */}
          {PLAN_GROUPS.map((g) => (
            <PeopleList
              key={g.id}
              title={`${g.label} subscribers`}
              count={byPlan(g.id).length}
              empty="No one on this plan yet."
              rows={byPlan(g.id).map((s) => ({
                primary: s.email,
                secondary: s.full_name || '—',
                tag:
                  s.status === 'canceled'
                    ? 'canceled'
                    : s.plan === 'lifetime'
                      ? 'forever'
                      : s.expires_at
                        ? `until ${new Date(s.expires_at).toLocaleDateString()}`
                        : 'active',
              }))}
            />
          ))}

          {/* Waitlist */}
          <PeopleList
            title="Lifetime waitlist"
            count={waitlist.length}
            empty="No one has joined the waitlist yet."
            rows={waitlist.map((w) => ({
              primary: w.email,
              secondary: new Date(w.created_at).toLocaleString(),
              tag: null,
            }))}
            copyable
          />
        </>
      )}
    </div>
  )
}

function SummaryChip({ icon: Icon, label, value }) {
  return (
    <GlassCard className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[var(--color-accent)]">{value}</p>
      </div>
      <Icon size={20} className="text-white/40" />
    </GlassCard>
  )
}

function PeopleList({ title, count, rows, empty, copyable }) {
  const copyAll = () => {
    const emails = rows.map((r) => r.primary).join(', ')
    navigator.clipboard?.writeText(emails)
  }
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">
          {title} <span className="ml-1 text-sm text-white/45">({count})</span>
        </h3>
        {copyable && count > 0 && (
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"
          >
            <Mail size={13} /> Copy all emails
          </button>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm text-white/45">{empty}</p>
      ) : (
        <ul className="max-h-64 divide-y divide-[var(--color-border)] overflow-auto">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{r.primary}</p>
                <p className="truncate text-xs text-white/40">{r.secondary}</p>
              </div>
              {r.tag && (
                <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/55">
                  {r.tag}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}
