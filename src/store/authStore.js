import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

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

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
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
