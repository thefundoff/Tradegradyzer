import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  // True briefly during an explicit sign-out so ProtectedRoute doesn't ALSO
  // redirect the (still-animating-out) protected page to /login and deadlock
  // the page transition. The sign-out handler navigates to '/' itself.
  signingOut: false,

  /** Bootstrap session + subscribe to auth changes. Call once at app start. */
  init: async () => {
    if (get().initialized) return
    set({ initialized: true })

    if (!isSupabaseConfigured) {
      set({ loading: false })
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })
    if (session?.user) await get().fetchProfile()
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      set({ session: newSession, user: newSession?.user ?? null })
      if (newSession?.user) {
        await get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })
  },

  fetchProfile: async () => {
    const user = get().user
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    set({ profile: data ?? null })
  },

  signUp: async (email, password, fullName, tradingProfile = null) => {
    // The trading profile rides along as user metadata; the handle_new_user
    // DB trigger persists it onto the profiles row (works even when email
    // confirmation is on and there's no client session yet).
    const data0 = { full_name: fullName }
    if (tradingProfile) {
      if (tradingProfile.style) data0.trader_style = tradingProfile.style
      if (tradingProfile.setups) data0.setups = tradingProfile.setups
      if (tradingProfile.risk) data0.risk_appetite = tradingProfile.risk
      if (tradingProfile.markets) data0.markets = tradingProfile.markets
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: data0 },
    })
    if (error) throw error
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
  },

  signOut: async () => {
    set({ signingOut: true })
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
    // Clear the flag once the route transition has settled, so future
    // unauthenticated access still redirects to /login normally.
    setTimeout(() => set({ signingOut: false }), 600)
  },

  /**
   * Email a password-reset link. Uses Supabase's built-in mailer, which can
   * deliver to any user without a verified sending domain. (Supabase doesn't
   * reveal whether the address exists, so this is also anti-enumeration.)
   *
   * To switch to the branded Resend email once a domain is verified, swap this
   * for: supabase.functions.invoke('send-password-reset', { body: { email } }).
   */
  requestPasswordReset: async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
  },

  /** Set a new password for the user in the active (recovery) session. */
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },

  /**
   * Save the trader's profile (style / setups / risk / markets) and mark them
   * onboarded. Used by the /onboarding gate and the Settings editor.
   */
  updateTradingProfile: async (tp) => {
    const user = get().user
    if (!user) throw new Error('Not signed in.')
    const patch = {
      trader_style: tp.style || null,
      setups: tp.setups || [],
      risk_appetite: tp.risk || null,
      markets: tp.markets || [],
      onboarded: true,
    }
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if (error) throw error
    await get().fetchProfile()
  },

  /**
   * True if the user has paid access right now. A 'canceled' subscription still
   * counts until its paid period (subscription_expires_at) elapses.
   */
  isSubscribed: () => {
    const p = get().profile
    if (!p) return false
    const paidStatus = p.subscription_status === 'active' || p.subscription_status === 'canceled'
    if (!paidStatus) return false
    if (!p.subscription_expires_at) return p.subscription_status === 'active'
    return new Date(p.subscription_expires_at) > new Date()
  },
}))
