import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Crown, LogOut, Download, Share, Check } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Spinner from '../components/ui/Spinner'
import PageTransition from '../components/ui/PageTransition'
import TradingProfileForm from '../components/TradingProfileForm'
import { useAuthStore } from '../store/authStore'
import { useInstall } from '../lib/installState'
import { cancelSubscription } from '../lib/analyses'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user, profile, isSubscribed, signOut, fetchProfile, updateTradingProfile } = useAuthStore()
  const navigate = useNavigate()
  const { canInstall, isIOS, standalone, promptInstall } = useInstall()
  const [name, setName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [canceling, setCanceling] = useState(false)

  // Trading profile editor
  const [tp, setTp] = useState({
    style: profile?.trader_style || '',
    setups: profile?.setups || [],
    risk: profile?.risk_appetite || '',
    markets: profile?.markets || [],
  })
  const [savingTp, setSavingTp] = useState(false)
  const [savedTp, setSavedTp] = useState(false)

  const saveTp = async () => {
    setSavingTp(true)
    setSavedTp(false)
    try {
      await updateTradingProfile(tp)
      setSavedTp(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setSavingTp(false)
    }
  }

  const canceled = profile?.subscription_status === 'canceled'
  const isLifetime = profile?.subscription_plan === 'lifetime'
  const expiryDate = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString()
    : null

  const cancel = async () => {
    setCanceling(true)
    try {
      await cancelSubscription()
      await fetchProfile()
      setConfirmCancel(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setCanceling(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
      await fetchProfile()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    navigate('/')
    await signOut()
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <GlassCard className="space-y-4 p-6">
          <h2 className="font-semibold">Profile</h2>
          <Field label="Full name" icon={User} value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Email" icon={Mail} value={user?.email || ''} disabled />
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : 'Save changes'}
            </Button>
            {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
          </div>
        </GlassCard>

        <GlassCard className="space-y-5 p-6">
          <div>
            <h2 className="font-semibold">Trading profile</h2>
            <p className="mt-0.5 text-sm text-white/55">
              We tune every grade — entry, stop and target — to how you trade.
            </p>
          </div>
          <TradingProfileForm value={tp} onChange={setTp} compact />
          <div className="flex items-center gap-3">
            <Button onClick={saveTp} disabled={savingTp}>
              {savingTp ? <Spinner /> : 'Save trading profile'}
            </Button>
            {savedTp && <span className="text-sm text-emerald-400">Saved ✓</span>}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crown size={22} className={isSubscribed() ? 'text-[var(--color-accent)]' : 'text-white/30'} />
              <div>
                <p className="font-semibold">Subscription</p>
                <p className="text-sm text-white/55">
                  {!isSubscribed()
                    ? 'Free plan'
                    : isLifetime
                      ? 'Lifetime · never expires'
                      : canceled
                        ? `${profile?.subscription_plan} · canceled · access until ${expiryDate}`
                        : `${profile?.subscription_plan} · renews ${expiryDate}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate('/pricing')}>
              {isSubscribed() ? 'Change plan' : 'Upgrade'}
            </Button>
          </div>

          {/* Cancel — only for recurring plans (lifetime is a one-time purchase) */}
          {isSubscribed() && !canceled && !isLifetime && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              {confirmCancel ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/70">
                    Cancel your plan? You'll keep access until {expiryDate}.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setConfirmCancel(false)} disabled={canceling}>
                      Keep plan
                    </Button>
                    <Button variant="danger" onClick={cancel} disabled={canceling}>
                      {canceling ? <Spinner /> : 'Confirm cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-sm text-white/50 underline underline-offset-4 decoration-white/20 hover:text-red-400 hover:decoration-red-400"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          )}
        </GlassCard>

        {/* Install app */}
        <GlassCard className="flex items-center justify-between gap-3 p-6">
          <div>
            <p className="font-semibold">Install app</p>
            {standalone ? (
              <p className="flex items-center gap-1 text-sm text-emerald-400">
                <Check size={14} /> Installed — you're running the app.
              </p>
            ) : isIOS ? (
              <p className="flex items-center gap-1 text-sm text-white/55">
                In Safari, tap <Share size={13} className="inline" /> then “Add to Home Screen”.
              </p>
            ) : canInstall ? (
              <p className="text-sm text-white/55">Add TradeGradyzer to your device for a full-screen app.</p>
            ) : (
              <p className="text-sm text-white/55">
                Use your browser's menu → “Install app” / “Add to Home screen”.
              </p>
            )}
          </div>
          {!standalone && canInstall && (
            <Button onClick={promptInstall}>
              <Download size={16} /> Install
            </Button>
          )}
        </GlassCard>

        <GlassCard className="flex items-center justify-between p-6">
          <div>
            <p className="font-semibold">Sign out</p>
            <p className="text-sm text-white/55">End your session on this device.</p>
          </div>
          <Button variant="danger" onClick={handleSignOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
