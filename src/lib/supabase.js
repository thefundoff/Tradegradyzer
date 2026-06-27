import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Don't crash the whole app in dev — surface a clear console hint instead.
  // Auth/DB calls will fail until .env is configured.
  // eslint-disable-next-line no-console
  console.warn(
    '[TradeGradyzer] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill them in.',
  )
}

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
