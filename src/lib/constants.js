export const TIMEFRAMES = [
  { id: '4h', label: '4-Hour', hint: 'Higher-timeframe bias & structure' },
  { id: '1h', label: '1-Hour', hint: 'Intermediate trend & key zones' },
  { id: '30m', label: '30-Min', hint: 'Entry timing & refinement' },
]

// Selectable timeframe values for each upload slot (high → low).
export const TIMEFRAME_OPTIONS = [
  '1M',
  '1W',
  '3D',
  '1D',
  '12h',
  '8h',
  '6h',
  '4h',
  '2h',
  '1h',
  '30m',
  '15m',
  '5m',
  '3m',
  '1m',
]

export const DEFAULT_TF_SLOTS = ['4h', '1h', '30m']
export const MAX_TF_SLOTS = 4
export const MIN_TF_SLOTS = 1

export const CONFIDENCE = {
  'A+': { label: 'A+', color: 'var(--color-grade-aplus)', desc: 'High-probability, textbook setup' },
  B: { label: 'B', color: 'var(--color-grade-b)', desc: 'Solid setup with minor concerns' },
  C: { label: 'C', color: 'var(--color-grade-c)', desc: 'Marginal — wait for confirmation' },
  F: { label: 'F', color: 'var(--color-grade-f)', desc: 'Avoid — no clean edge' },
}

export const PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 5,
    currency: '$',
    interval: 'week',
    blurb: 'Try the full power, billed weekly.',
    features: ['15 analyses per week', 'Multi-timeframe scoring', 'Key levels + entry marking', 'Analysis history'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 15,
    currency: '$',
    interval: 'month',
    blurb: 'Best value for serious traders.',
    highlighted: true,
    features: [
      '60 analyses per month',
      'Everything in Weekly',
      'Save & export reports',
      'Setup performance trends',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 5,
    currency: '$',
    interval: 'lifetime',
    blurb: 'Pay once. Yours forever.',
    badge: 'Lifetime deal',
    features: [
      '25 analyses every month — forever',
      'One-time payment, never billed again',
      'Multi-timeframe scoring + key levels',
      'Save & export reports + performance trends',
    ],
  },
]

// Free plan: 1 analysis per rolling 24h (enforced server-side in the edge function).
export const FREE_ANALYSIS_LIMIT = 1

// Lifetime campaign: hard cap on how many lifetime seats can ever be sold.
// Enforced server-side (claim_lifetime_seat); keep in sync with the edge functions.
export const LIFETIME_LIMIT = 100

// Analysis quotas per plan (enforced server-side). `days` = rolling window.
export const PLAN_QUOTAS = {
  free: { limit: 1, days: 1, label: 'day' },
  weekly: { limit: 15, days: 7, label: 'week' },
  monthly: { limit: 60, days: 30, label: 'month' },
  // Lifetime: one-time purchase, 25 analyses per rolling 30 days, never expires.
  lifetime: { limit: 25, days: 30, label: 'month' },
}

// Fixed per-currency price tiers (NOT live FX). Keyed by plan id.
// Add a currency here to localize pricing for that region; anything not
// listed falls back to USD. These are the amounts you'd charge via Paystack.
export const PRICE_TIERS = {
  USD: { weekly: 5, monthly: 15, lifetime: 5 },
  NGN: { weekly: 3900, monthly: 14000, lifetime: 5000 },
  GHS: { weekly: 70, monthly: 200, lifetime: 70 },
  ZAR: { weekly: 90, monthly: 270, lifetime: 95 },
  KES: { weekly: 650, monthly: 1900, lifetime: 700 },
  GBP: { weekly: 4, monthly: 12, lifetime: 4 },
  EUR: { weekly: 5, monthly: 14, lifetime: 5 },
  INR: { weekly: 399, monthly: 1199, lifetime: 425 },
  CAD: { weekly: 7, monthly: 20, lifetime: 7 },
  AUD: { weekly: 8, monthly: 22, lifetime: 8 },
}

// "Regular" (compare-at) prices shown struck-through on the Lifetime card to
// anchor the discount. Localized per currency, mirroring PRICE_TIERS. Only the
// lifetime plan uses these today — anchored on NGN ₦96,000 (~19.2× the deal).
export const REGULAR_PRICE_TIERS = {
  USD: { lifetime: 96 },
  NGN: { lifetime: 96000 },
  GHS: { lifetime: 1344 },
  ZAR: { lifetime: 1824 },
  KES: { lifetime: 13440 },
  GBP: { lifetime: 77 },
  EUR: { lifetime: 96 },
  INR: { lifetime: 8160 },
  CAD: { lifetime: 134 },
  AUD: { lifetime: 154 },
}
