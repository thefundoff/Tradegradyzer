import { useEffect, useState } from 'react'
import { currencyForCountry } from './countryCurrency'
import { PRICE_TIERS, REGULAR_PRICE_TIERS } from './constants'

// We detect the visitor's country by IP, map it to a currency, and show the
// FIXED price tier for that currency (no live FX). Anything we don't have a
// tier for falls back to USD. Result is cached so there's no flicker.

const CACHE_KEY = 'tg_pricing_v2'
const TTL = 12 * 60 * 60 * 1000 // 12h

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.ts || Date.now() - data.ts > TTL) return null
    return data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota/private mode */
  }
}

async function fetchGeo() {
  // ipwho.is — free, no key, CORS-enabled.
  const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(6000) })
  const j = await res.json()
  if (j && j.success !== false) {
    const country = j.country_code || null
    const currency = j.currency?.code || currencyForCountry(country)
    if (currency) return { currency, country }
  }
  throw new Error('geo lookup failed')
}

async function resolvePricing() {
  const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
  let currency = 'USD'
  let country = null
  try {
    const geo = await fetchGeo()
    currency = geo.currency || 'USD'
    country = geo.country
  } catch {
    /* fall back to USD */
  }
  const out = { currency, country, locale, ts: Date.now() }
  writeCache(out)
  return out
}

export function formatPrice(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

/**
 * React hook: returns plans with a localized `display` (from fixed tiers) plus
 * the resolved currency. Uses a fresh cache instantly when present.
 */
export function useLocalizedPricing(plans) {
  const [state, setState] = useState(() => {
    const c = readCache()
    return c
      ? { loading: false, ...c }
      : { loading: true, currency: 'USD', locale: 'en-US', country: null }
  })

  useEffect(() => {
    if (!state.loading) return // already have a fresh cache
    let alive = true
    resolvePricing().then((res) => {
      if (alive) setState({ loading: false, ...res })
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Use the detected currency only if we have a fixed tier for it.
  const currency = PRICE_TIERS[state.currency] ? state.currency : 'USD'
  const tier = PRICE_TIERS[currency]

  const localized = plans.map((p) => {
    const amount = tier[p.id] ?? p.price
    // Optional struck-through "regular" price for this currency (e.g. Lifetime).
    const regularAmount = REGULAR_PRICE_TIERS[currency]?.[p.id]
    return {
      ...p,
      display: formatPrice(amount, currency, state.locale),
      regularAmount: regularAmount ?? null,
      regularDisplay:
        regularAmount != null ? formatPrice(regularAmount, currency, state.locale) : null,
      localCurrency: currency,
      localAmount: amount,
      isConverted: currency !== 'USD',
      usd: PRICE_TIERS.USD[p.id] ?? p.price,
    }
  })

  return { plans: localized, currency, country: state.country, loading: state.loading }
}
