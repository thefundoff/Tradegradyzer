import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CircleCheck, CreditCard, Crown, Lock, Zap } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import { PLANS, PRICE_TIERS, LIFETIME_LIMIT } from '../lib/constants'
import { useLocalizedPricing } from '../lib/currency'
import { useAuthStore } from '../store/authStore'
import { activateSubscriptionMock } from '../lib/analyses'
import { joinWaitlist } from '../lib/admin'
import {
  paystackEnabled,
  PAYSTACK_CURRENCIES,
  payWithPaystack,
  verifyPaystack,
  lifetimeSeatsTaken,
} from '../lib/paystack'

export default function Pricing() {
  const { user, profile, isSubscribed, fetchProfile } = useAuthStore()
  const [processing, setProcessing] = useState(null)
  const [done, setDone] = useState(false)
  const subscribed = isSubscribed()
  const currentPlan = subscribed ? profile?.subscription_plan : null
  const canceled = profile?.subscription_status === 'canceled'
  const { plans, currency, loading: pricingLoading } = useLocalizedPricing(PLANS)

  // Live count of how many lifetime seats remain (capped campaign).
  const [seatsTaken, setSeatsTaken] = useState(null)
  const lifetimeLeft = seatsTaken == null ? null : Math.max(0, LIFETIME_LIMIT - seatsTaken)
  const lifetimeSoldOut = lifetimeLeft === 0

  const refreshSeats = () => lifetimeSeatsTaken().then(setSeatsTaken).catch(() => {})
  useEffect(() => {
    refreshSeats()
  }, [])

  // Waitlist capture for when the lifetime offer is sold out.
  const [waitEmail, setWaitEmail] = useState('')
  const [waitBusy, setWaitBusy] = useState(false)
  const [waitDone, setWaitDone] = useState(false)
  useEffect(() => {
    if (user?.email) setWaitEmail((e) => e || user.email)
  }, [user])

  const submitWaitlist = async (e) => {
    e.preventDefault()
    setWaitBusy(true)
    try {
      await joinWaitlist(waitEmail)
      setWaitDone(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setWaitBusy(false)
    }
  }

  // What the CTA on each plan card should say/do for this user.
  const planCta = (plan) => {
    // Sold-out lifetime: closed to anyone who isn't already a holder.
    if (plan.id === 'lifetime' && currentPlan !== 'lifetime' && lifetimeSoldOut) {
      return { label: 'Sold out', disabled: true }
    }
    if (!currentPlan) return { label: `Choose ${plan.name}`, disabled: false }
    if (plan.id === currentPlan) {
      // Lifetime is a one-time purchase — it never lapses, so never "Renew".
      if (plan.id === 'lifetime') return { label: 'Current plan', disabled: true }
      return canceled ? { label: 'Renew', disabled: false } : { label: 'Current plan', disabled: true }
    }
    // Lifetime holders already have permanent access — nothing else to buy.
    if (currentPlan === 'lifetime') return { label: 'Included in Lifetime', disabled: true }
    // Anyone (free or recurring) can move up to the Lifetime deal.
    if (plan.id === 'lifetime') return { label: 'Get Lifetime', disabled: false }
    if (currentPlan === 'weekly' && plan.id === 'monthly') {
      return { label: 'Upgrade to Monthly', disabled: false }
    }
    return { label: 'Included in your plan', disabled: true } // monthly user viewing weekly
  }

  const subscribe = async (planId) => {
    // Don't even open checkout if the lifetime campaign is already full.
    if (planId === 'lifetime' && lifetimeSoldOut) {
      alert('The lifetime offer is sold out — all spots have been claimed.')
      return
    }
    setProcessing(planId)
    try {
      if (paystackEnabled) {
        // Charge in the user's currency if Paystack supports it, else USD.
        const chargeCurrency = PAYSTACK_CURRENCIES.includes(currency) ? currency : 'USD'
        const amountMajor = PRICE_TIERS[chargeCurrency][planId]
        const reference = `tg_${user.id.slice(0, 8)}_${Date.now()}`
        const ref = await payWithPaystack({
          email: user.email,
          amount: amountMajor * 100, // minor units
          currency: chargeCurrency,
          reference,
          metadata: { user_id: user.id, plan: planId },
        })
        await verifyPaystack(ref, planId)
      } else {
        // Fallback mock when no Paystack public key is configured.
        await activateSubscriptionMock(user.id, planId)
      }
      await fetchProfile()
      setDone(true)
    } catch (e) {
      // The last lifetime seat sold while they were paying — they were refunded.
      if (/sold_out/i.test(e.message || '')) {
        alert(
          'Sorry — the final lifetime spot was claimed while you were paying. ' +
            "Your payment is being refunded. You haven't been charged.",
        )
      } else if (!/cancel/i.test(e.message || '')) {
        // Cancelled popup isn't an error worth alerting on.
        alert(e.message)
      }
    } finally {
      if (planId === 'lifetime') refreshSeats()
      setProcessing(null)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Trade smarter for less</h1>
          <p className="mt-2 text-white/55">More analyses, better grades. Cancel anytime.</p>
          {subscribed && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] bg-white/5 px-4 py-1.5 text-sm text-white">
              <Crown size={16} className="text-[var(--color-accent)]" /> Active: {profile?.subscription_plan} plan
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard
                strong={plan.highlighted}
                className={`relative h-full p-7 ${plan.highlighted ? 'border-[var(--color-accent)]/40' : ''}`}
              >
                {(plan.badge || plan.highlighted) && (
                  <span className="absolute -top-3 right-6 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[var(--color-accent-fg)]">
                    {plan.badge || 'Best value'}
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/55">{plan.blurb}</p>
                <div className="mt-4">
                  {pricingLoading ? (
                    <span className="my-1 block h-9 w-28 rounded-md bg-white/10 shimmer" />
                  ) : (
                    <>
                      {plan.regularDisplay && (
                        <div className="text-sm font-semibold text-white/35 line-through decoration-2">
                          {plan.regularDisplay}
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">{plan.display}</span>
                        <span className="text-white/50">/ {plan.interval}</span>
                      </div>
                    </>
                  )}
                </div>

                {plan.id === 'lifetime' && lifetimeLeft != null && (
                  <p
                    className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${
                      lifetimeSoldOut ? 'text-white/40' : 'text-amber-300'
                    }`}
                  >
                    {lifetimeSoldOut ? (
                      `All ${LIFETIME_LIMIT} spots claimed`
                    ) : (
                      <>
                        <Zap size={15} className="shrink-0 fill-current" />
                        Only {lifetimeLeft} of {LIFETIME_LIMIT} spots left
                      </>
                    )}
                  </p>
                )}

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/75">
                      <Check size={16} className="text-white/70" /> {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'lifetime' && lifetimeSoldOut && currentPlan !== 'lifetime' ? (
                  waitDone ? (
                    <p className="mt-7 text-center text-sm font-medium text-[var(--color-accent)]">
                      ✓ You're on the waitlist — we'll email you if a spot opens.
                    </p>
                  ) : (
                    <form onSubmit={submitWaitlist} className="mt-7 space-y-2">
                      <p className="text-xs text-white/55">
                        Sold out — join the waitlist for the next batch.
                      </p>
                      <input
                        type="email"
                        required
                        value={waitEmail}
                        onChange={(e) => setWaitEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-subtle)] px-3 py-2.5 text-sm text-white placeholder-white/35 outline-none transition focus:border-[var(--color-accent)]/50"
                      />
                      <Button type="submit" className="w-full" disabled={waitBusy}>
                        {waitBusy ? <Spinner /> : 'Join the waitlist'}
                      </Button>
                    </form>
                  )
                ) : (
                  <Button
                    className="mt-7 w-full"
                    variant={plan.highlighted ? 'primary' : 'ghost'}
                    disabled={!!processing || planCta(plan).disabled}
                    onClick={() => subscribe(plan.id)}
                  >
                    {processing === plan.id ? <Spinner /> : planCta(plan).label}
                  </Button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-white/40">
          {currency !== 'USD' && !pricingLoading
            ? `Prices shown in ${currency} based on your location.`
            : ''}
          {paystackEnabled ? (
            <>
              <Lock size={13} className="shrink-0" /> Secure checkout by Paystack.
            </>
          ) : (
            <>
              <CreditCard size={13} className="shrink-0" /> Payments are currently mocked for testing.
            </>
          )}
        </p>
      </div>

      {/* Success modal */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur-sm"
          >
            <GlassCard strong className="max-w-sm p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220 }}
                className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              >
                <CircleCheck size={32} />
              </motion.div>
              <h2 className="text-xl font-bold">You're all set</h2>
              <p className="mt-2 text-sm text-white/60">
                Your subscription is active. Enjoy your analyses.
              </p>
              <Button className="mt-6 w-full" onClick={() => setDone(false)}>
                Start analyzing
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
