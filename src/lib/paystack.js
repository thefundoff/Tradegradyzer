import { supabase } from './supabase'

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
export const paystackEnabled = !!PUBLIC_KEY

// Currencies Paystack can charge. Anything else falls back to USD.
export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD']

let scriptPromise = null
function loadScript() {
  if (typeof window !== 'undefined' && window.PaystackPop) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Paystack. Check your connection.'))
    document.body.appendChild(s)
  })
  return scriptPromise
}

/**
 * Open the Paystack checkout popup.
 * @returns {Promise<string>} the transaction reference on success.
 */
export async function payWithPaystack({ email, amount, currency, reference, metadata }) {
  await loadScript()
  return new Promise((resolve, reject) => {
    const handler = window.PaystackPop.setup({
      key: PUBLIC_KEY,
      email,
      amount, // minor units (kobo/cents)
      currency,
      ref: reference,
      metadata,
      callback: (response) => resolve(response.reference),
      onClose: () => reject(new Error('Payment cancelled.')),
    })
    handler.openIframe()
  })
}

/** How many lifetime seats have sold (for the live "N of 100 left" counter). */
export async function lifetimeSeatsTaken() {
  const { data, error } = await supabase.rpc('lifetime_seats_taken')
  if (error) throw new Error(error.message)
  return data || 0
}

/** Server-side verification + subscription grant. */
export async function verifyPaystack(reference, plan) {
  const { data, error } = await supabase.functions.invoke('paystack-verify', {
    body: { reference, plan },
  })
  if (error) throw new Error(error.message || 'Verification failed.')
  if (!data?.ok) throw new Error(data?.error || 'Payment could not be verified.')
  return data.profile
}
