import { supabase } from './supabase'
import { PLAN_QUOTAS } from './constants'

const BUCKET = 'charts'

/**
 * How many analyses the user has left. For rolling plans (`days` set) this
 * counts usage in the current window; for the free plan (`days: null`) it
 * counts ALL-TIME usage, so the free analysis is once forever.
 */
export async function getRemainingQuota(userId, planKey = 'free') {
  const q = PLAN_QUOTAS[planKey] || PLAN_QUOTAS.free
  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (q.days != null) {
    const since = new Date(Date.now() - q.days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', since)
  }
  const { count } = await query
  const used = count || 0
  return { limit: q.limit, used, remaining: Math.max(0, q.limit - used), label: q.label }
}

/** Upload a chart image to Storage and return its public-ish path. */
async function uploadChart(userId, analysisId, tf, file) {
  if (!file) return null
  const ext = (file.name?.split('.').pop() || 'png').toLowerCase()
  const path = `${userId}/${analysisId}/${tf}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/png',
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Persist an analysis + its chart images. Returns the saved row. */
export async function saveAnalysis({ userId, pair, notes, files, result }) {
  const id = crypto.randomUUID()

  const images = {}
  for (const [tf, file] of Object.entries(files)) {
    if (file) images[tf] = await uploadChart(userId, id, tf, file)
  }

  const row = {
    id,
    user_id: userId,
    pair: pair || result.pair || null,
    notes: notes || null,
    score: result.overallScore,
    confidence: result.confidence,
    bias: result.bias,
    result,
    images,
  }

  const { data, error } = await supabase.from('analyses').insert(row).select().single()
  if (error) throw error
  return data
}

export async function listAnalyses(userId, limit = 50) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getAnalysis(id) {
  const { data, error } = await supabase.from('analyses').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/** Log (or update) how a setup actually played out. */
export async function updateOutcome(id, { outcome, rr, note }) {
  const patch = {
    outcome,
    outcome_rr: rr === '' || rr == null ? null : Number(rr),
    outcome_note: note || null,
    outcome_logged_at: outcome === 'pending' ? null : new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('analyses')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

const GRADES = ['A+', 'B', 'C', 'F']

/**
 * Aggregate this user's logged outcomes into win-rate stats per grade,
 * plus a few recent losing setups to feed back as "lessons".
 * Returns null when there's not enough decided history to be useful.
 */
export async function getCalibration(userId, { minDecided = 3 } = {}) {
  const { data, error } = await supabase
    .from('analyses')
    .select('confidence, score, pair, outcome, outcome_rr, outcome_note, result, created_at')
    .eq('user_id', userId)
    .neq('outcome', 'pending')
    .order('created_at', { ascending: false })
    .limit(80)
  if (error || !data) return null

  const decided = data.filter((a) => a.outcome === 'win' || a.outcome === 'loss')
  if (decided.length < minDecided) return null

  const perGrade = GRADES.map((g) => {
    const rows = decided.filter((a) => a.confidence === g)
    const wins = rows.filter((a) => a.outcome === 'win').length
    return { grade: g, total: rows.length, wins, winRate: rows.length ? Math.round((wins / rows.length) * 100) : null }
  }).filter((x) => x.total > 0)

  const wins = decided.filter((a) => a.outcome === 'win').length
  const overall = Math.round((wins / decided.length) * 100)

  const lessons = data
    .filter((a) => a.outcome === 'loss')
    .slice(0, 5)
    .map((a) => {
      const tag = `${a.confidence} ${a.pair || 'setup'}`
      const why = a.outcome_note ? ` — "${a.outcome_note}"` : a.result?.summary ? ` — ${String(a.result.summary).slice(0, 90)}` : ''
      return `Graded ${tag} but it LOST${why}`
    })

  return { overall, decided: decided.length, perGrade, lessons }
}

/** Full performance breakdown for the dashboard. */
export async function getPerformance(userId) {
  const { data, error } = await supabase
    .from('analyses')
    .select('confidence, outcome, outcome_rr')
    .eq('user_id', userId)
  if (error || !data) return null

  const decided = data.filter((a) => a.outcome === 'win' || a.outcome === 'loss')
  const wins = decided.filter((a) => a.outcome === 'win').length
  const rrs = decided.map((a) => Number(a.outcome_rr)).filter((n) => !Number.isNaN(n))
  const perGrade = GRADES.map((g) => {
    const rows = decided.filter((a) => a.confidence === g)
    const w = rows.filter((a) => a.outcome === 'win').length
    return { grade: g, total: rows.length, wins: w, winRate: rows.length ? Math.round((w / rows.length) * 100) : null }
  })

  return {
    total: data.length,
    decided: decided.length,
    pending: data.filter((a) => a.outcome === 'pending').length,
    wins,
    losses: decided.filter((a) => a.outcome === 'loss').length,
    winRate: decided.length ? Math.round((wins / decided.length) * 100) : null,
    avgRr: rrs.length ? Math.round((rrs.reduce((a, b) => a + b, 0) / rrs.length) * 100) / 100 : null,
    perGrade,
  }
}

export async function countAnalyses(userId) {
  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count || 0
}

/**
 * MOCK payment / subscription activation.
 * Subscription columns are locked against client writes (migration 0003),
 * so activation goes through the `mock-subscribe` edge function (service role).
 * When wiring Paystack, verify the transaction inside that function.
 */
/** Cancel the current subscription (keeps access until the paid period ends). */
export async function cancelSubscription() {
  const { data, error } = await supabase.functions.invoke('cancel-subscription', { body: {} })
  if (error) throw new Error(error.message || 'Could not cancel subscription.')
  return data?.profile
}

export async function activateSubscriptionMock(_userId, plan) {
  // Simulate a payment-processor round trip.
  await new Promise((r) => setTimeout(r, 900))

  const { data, error } = await supabase.functions.invoke('mock-subscribe', {
    body: { plan },
  })
  if (error) throw new Error(error.message || 'Could not activate subscription.')
  return data?.profile
}
