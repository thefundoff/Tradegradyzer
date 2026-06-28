// Supabase Edge Function: analyze-chart
// Runs server-side so the Gemini API key never reaches the browser.
//
// Deploy:
//   supabase functions deploy analyze-chart --no-verify-jwt=false
//   supabase secrets set GEMINI_API_KEY=xxxxx
//
// Optional secret: GEMINI_MODEL (defaults to gemini-2.5-flash, free tier).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// Analysis quotas per plan (rolling window). Must mirror src/lib/constants.js.
// `days: null` ⇒ all-time window. The free analysis is once forever, not
// per-day: it's enforced by counting the user's entire usage history.
const PLAN_QUOTAS: Record<string, { limit: number; days: number | null }> = {
  free: { limit: 1, days: null },
  weekly: { limit: 15, days: 7 },
  monthly: { limit: 60, days: 30 },
  lifetime: { limit: 25, days: 30 },
}
const RATE_PER_MIN = 6 // max analyses per user per minute
const MAX_IMAGES = 4
const MAX_IMAGE_CHARS = 6_000_000 // ~4.4 MB of base64 per image

// Gemini can intermittently return 429/503 (overloaded) or just be slow on
// multi-image vision calls. Retry transient failures with backoff and bound
// each attempt with a timeout so a hung upstream fails cleanly instead of as
// an opaque platform 502.
const GEMINI_MAX_ATTEMPTS = 3
const GEMINI_TIMEOUT_MS = 55_000 // per attempt; under typical function limits
const GEMINI_BACKOFF_MS = [800, 2000] // waits before attempts 2 and 3

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Returns the Gemini Response on success, or throws after exhausting retries.
// Retries on network errors, timeouts, and 429/5xx; surfaces 4xx (other than
// 429) immediately since those won't fix themselves.
async function callGeminiWithRetry(url: string, body: string): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      })
      // Retry only on overload / server errors.
      if (res.status === 429 || res.status >= 500) {
        if (attempt < GEMINI_MAX_ATTEMPTS) {
          await res.body?.cancel() // free the connection before retrying
          await sleep(GEMINI_BACKOFF_MS[attempt - 1])
          continue
        }
      }
      return res
    } catch (err) {
      // Network error or abort/timeout — retry if attempts remain.
      lastErr = err
      if (attempt < GEMINI_MAX_ATTEMPTS) {
        await sleep(GEMINI_BACKOFF_MS[attempt - 1])
        continue
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Gemini request failed after retries')
}

// Structured-output schema we ask Gemini to fill.
const responseSchema = {
  type: 'object',
  properties: {
    pair: { type: 'string' },
    overallScore: { type: 'integer', description: 'Setup quality 10-100' },
    confidence: { type: 'string', enum: ['A+', 'B', 'C', 'F'] },
    bias: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
    summary: { type: 'string' },
    tailored: {
      type: 'string',
      description:
        "How this read fits the trader's profile, e.g. which of their setups the entry is based on, or a note if none of their setups are present.",
    },
    entry: {
      type: 'object',
      properties: {
        price: { type: 'number' },
        type: { type: 'string', enum: ['market', 'limit', 'stop'] },
        rationale: { type: 'string' },
      },
    },
    stopLoss: { type: 'number' },
    takeProfit: { type: 'number' },
    riskReward: { type: 'number' },
    warnings: { type: 'array', items: { type: 'string' } },
    timeframes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', description: 'The label the trader assigned to this slot' },
          detectedTimeframe: {
            type: 'string',
            description: 'The timeframe you actually read from the chart UI/axis, or "unknown"',
          },
          readability: {
            type: 'string',
            enum: ['clear', 'busy', 'unreadable'],
            description: 'How legible the price action is under any indicators/drawings',
          },
          trend: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
          comment: { type: 'string' },
          keyLevels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['support', 'resistance', 'pivot'] },
                price: { type: 'number' },
                yNorm: { type: 'number', description: '0=top edge, 1=bottom edge of THIS image' },
                strength: { type: 'string', enum: ['weak', 'medium', 'strong'] },
                label: { type: 'string' },
              },
              required: ['type', 'yNorm'],
            },
          },
          entryZone: {
            type: 'object',
            properties: {
              yNorm: { type: 'number' },
              price: { type: 'number' },
            },
          },
        },
        required: ['timeframe', 'keyLevels'],
      },
    },
  },
  required: ['overallScore', 'confidence', 'bias', 'summary', 'timeframes'],
}

// Canonicalize timeframes for comparison. Case matters: 'M' = month, 'm' = minute.
function normTf(s: string | undefined | null): string {
  if (!s) return ''
  const str = String(s).trim()
  if (/unknown|n\/?a|none/i.test(str)) return 'unknown'
  const num = (str.match(/\d+/) || ['1'])[0]

  let unit = ''
  if (/min|minute/i.test(str)) unit = 'm'
  else if (/month|monthly|\dmo\b/i.test(str)) unit = 'mo'
  else if (/hour|hr/i.test(str)) unit = 'h'
  else if (/week|wk/i.test(str)) unit = 'w'
  else if (/day|daily/i.test(str)) unit = 'd'
  else {
    const letters = str.match(/[a-zA-Z]/g)
    const last = letters ? letters[letters.length - 1] : ''
    if (last === 'm') unit = 'm'
    else if (last === 'M') unit = 'mo'
    else if (last === 'h' || last === 'H') unit = 'h'
    else if (last === 'd' || last === 'D') unit = 'd'
    else if (last === 'w' || last === 'W') unit = 'w'
  }
  return unit ? `${num}${unit}` : ''
}

interface Calibration {
  overall?: number
  decided?: number
  perGrade?: { grade: string; total: number; wins: number; winRate: number | null }[]
  lessons?: string[]
}

interface TraderProfile {
  style?: string | null
  setups?: string[]
  risk?: string | null
  markets?: string[]
}

// Tailors the analysis to how this specific trader trades. The model is told to
// frame entry/SL/TP around the trader's own setups and risk appetite — without
// inventing a setup that isn't actually on the chart.
function buildTraderProfileBlock(tp: TraderProfile | null): string {
  if (!tp || (!tp.style && !(tp.setups && tp.setups.length))) return ''
  const setups = (tp.setups || []).filter(Boolean)
  const markets = (tp.markets || []).filter(Boolean)
  const riskGuide: Record<string, string> = {
    Conservative:
      'Prefer tighter, structurally-protected stops and only high-quality entries; aim for ~2R or better and be willing to grade marginal setups lower.',
    Balanced: 'Aim for a standard ~1.5–2R; balance entry proximity against stop safety.',
    Aggressive:
      'Allow wider targets and runners (3R+ where structure supports it); a slightly looser entry is acceptable to catch the move.',
  }
  const styleGuide: Record<string, string> = {
    Scalper: 'Weight the lowest timeframe most; expect tight stops and nearby targets.',
    'Day trader': 'Focus on intraday structure; the trade should make sense to open and close within a session.',
    'Swing trader': 'Anchor on higher-timeframe structure; allow multi-day holds and wider stops/targets.',
    'Position trader': 'Prioritize macro/higher-timeframe structure; tolerate wide stops for large moves.',
  }
  return `
TAILOR TO THIS TRADER — personalize the read to how they actually trade:
- Trading style: ${tp.style || 'unspecified'}. ${tp.style ? styleGuide[tp.style] || '' : ''}
- Setups they trade: ${setups.length ? setups.join(', ') : 'unspecified'}.
  PRIORITIZE these when locating the entry. If you can frame the entry as one of
  the trader's setups that genuinely exists on the chart, do so and NAME that
  setup in the entry rationale and the "tailored" field. If none of their setups
  are present, say so plainly in "tailored" and grade on the cleanest real
  structure instead — never fabricate a setup just to match their preference.
- Risk appetite: ${tp.risk || 'unspecified'}. ${tp.risk ? riskGuide[tp.risk] || '' : ''}
${markets.length ? `- Markets they trade: ${markets.join(', ')} — apply the volatility/session norms of these markets.` : ''}
Set the stop-loss and take-profit consistent with the style and risk appetite above.
`
}

function buildCalibrationBlock(cal: Calibration | null): string {
  if (!cal || !cal.decided) return ''
  const grades = (cal.perGrade || [])
    .map((g) => `  - ${g.grade}: ${g.wins}/${g.total} won${g.winRate != null ? ` (${g.winRate}%)` : ''}`)
    .join('\n')
  const lessons = (cal.lessons || []).map((l) => `  - ${l}`).join('\n')
  return `
PERSONALIZED CALIBRATION — this specific trader's past grades vs REAL outcomes
(overall ${cal.overall ?? '?'}% win rate over ${cal.decided} decided setups):
${grades || '  - (not enough per-grade history yet)'}
${lessons ? `Recent setups that LOST despite your grade — learn from these:\n${lessons}` : ''}
Use this to CALIBRATE: if a grade tier has been underperforming (e.g. A+ winning
well under ~75%, or any tier near/below 50%), grade more conservatively this time.
Account for the mistake patterns above. Do not blindly repeat an over-optimistic grade.
`
}

function buildPrompt(
  pair: string,
  notes: string,
  tfs: string[],
  cal: Calibration | null,
  tp: TraderProfile | null,
) {
  return `You are an elite price-action trading analyst. You are given trading chart
screenshots. The trader LABELLED them (in order) as: ${tfs.join(', ')}.
${pair ? `The instrument is ${pair}.` : ''}
${notes ? `Trader's note: "${notes}".` : ''}
${buildTraderProfileBlock(tp)}
${buildCalibrationBlock(cal)}

IMPORTANT — verify the inputs before trusting them:
1. TIMEFRAME CHECK. Do not assume the labels are correct. Read the ACTUAL timeframe
   from each chart (the timeframe selector, axis date spacing, or watermark) and put it
   in "detectedTimeframe" (e.g. "4h", "1h", "30m", "15m", "1d", or "unknown").
   - If a detected timeframe does not match its label, add a clear warning, e.g.
     "Slot labelled 4h appears to be a 30m chart — treat the higher-timeframe read with caution."
   - If two or more charts are actually the SAME timeframe (e.g. three 30m charts), say so
     in a warning, and DO NOT inflate the score for "multi-timeframe confluence" that does
     not exist — grade it as the single-timeframe setup it really is.
   - Base every conclusion on the DETECTED timeframe, not the label.

2. READABILITY CHECK. Charts may carry indicators (RSI/MACD/MAs/volume) and trader
   drawings (trendlines, boxes, fibs, notes). For each chart set "readability":
   - "clear": price action is easy to read.
   - "busy": usable but cluttered — rely on raw candlesticks/structure, treat the trader's
     own drawings as opinions (supporting context), not as confirmed levels.
   - "unreadable": indicators/drawings obscure the price so you cannot reliably locate
     levels. When unreadable, omit guessed levels, lower the score and confidence, and add
     a warning asking for a cleaner (ideally naked candlestick) screenshot.
   Never mistake a trader-drawn line for real market structure.

Then perform a top-down, multi-timeframe analysis:
- Identify market structure, trend, and the most important support/resistance levels from
  PRICE ACTION first.
- For EACH image, return key levels with a "yNorm" = the vertical position of that price
  line within THAT specific image (0.0 = top pixel row, 1.0 = bottom). Be precise — these
  are drawn back onto the image as horizontal lines.
- Determine an overall directional bias and a single best entry (price + yNorm on the
  lowest timeframe), a protective stop loss, and a realistic take-profit with R:R.
- Score overall setup quality 10 (no edge) to 100 (textbook A+). Reduce the score for
  timeframe mismatches, missing confluence, or poor readability.
- Map score to confidence: A+ (>=85), B (70-84), C (50-69), F (<50).

Return ONLY structured JSON matching the provided schema. Estimate numeric prices from
visible axis labels; if unreadable, still provide yNorm and omit price.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
      return json({ error: 'GEMINI_API_KEY is not configured on the function.' }, 500)
    }

    const { images, pair = '', notes = '', calibration = null, traderProfile = null } =
      await req.json()
    if (!Array.isArray(images) || images.length === 0) {
      return json({ error: 'No images provided.' }, 400)
    }

    // ── Input caps (cheap DoS / cost guards) ─────────────────────
    if (images.length > MAX_IMAGES) {
      return json({ error: `Too many charts (max ${MAX_IMAGES}).` }, 400)
    }
    for (const im of images) {
      if (typeof im?.data !== 'string' || im.data.length === 0) {
        return json({ error: 'Invalid image payload.' }, 400)
      }
      if (im.data.length > MAX_IMAGE_CHARS) {
        return json({ error: 'One of the images is too large (max ~4MB).' }, 413)
      }
    }
    const safeNotes = String(notes || '').slice(0, 500)

    // ── Identify caller + enforce subscription / limits ──────────
    const authHeader = req.headers.get('Authorization') || ''
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await authed.auth.getUser()
    if (!user) return json({ error: 'Unauthorized.' }, 401)

    // Per-user rate limit (recent ledger rows).
    const since = new Date(Date.now() - 60_000).toISOString()
    const { count: recent } = await admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)
    if ((recent ?? 0) >= RATE_PER_MIN) {
      return json({ status: 'rate_limited' }, 200)
    }

    // Resolve the caller's plan → quota, then enforce it over a rolling window.
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_status, subscription_plan, subscription_expires_at')
      .eq('id', user.id)
      .single()
    const paidStatus =
      profile?.subscription_status === 'active' || profile?.subscription_status === 'canceled'
    const subscribed =
      paidStatus &&
      (!profile.subscription_expires_at ||
        new Date(profile.subscription_expires_at) > new Date())

    const planKey = subscribed ? profile?.subscription_plan || 'monthly' : 'free'
    const quota = PLAN_QUOTAS[planKey] || PLAN_QUOTAS.free
    const usageQuery = admin
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    // Free plan (days: null) counts all-time usage → one free analysis ever.
    // Paid plans count only within their rolling window.
    const { count: usedInPeriod } =
      quota.days != null
        ? await usageQuery.gte(
            'created_at',
            new Date(Date.now() - quota.days * 24 * 60 * 60 * 1000).toISOString(),
          )
        : await usageQuery
    if ((usedInPeriod ?? 0) >= quota.limit) {
      return json(
        {
          status: 'limit_reached',
          reason: subscribed ? 'plan_quota' : 'free_used',
          plan: planKey,
          limit: quota.limit,
          days: quota.days,
        },
        200,
      )
    }

    const tfs = images.map((i: { timeframe: string }) => i.timeframe)

    const parts: unknown[] = [
      { text: buildPrompt(pair, safeNotes, tfs, calibration, traderProfile) },
    ]
    for (const img of images) {
      parts.push({ text: `--- Timeframe: ${img.timeframe} ---` })
      parts.push({ inlineData: { mimeType: img.mimeType || 'image/png', data: img.data } })
    }

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const geminiBody = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema,
      },
    })

    let geminiRes: Response
    try {
      geminiRes = await callGeminiWithRetry(url, geminiBody)
    } catch (err) {
      // All attempts exhausted (timeouts / network). Tell the client it's a
      // transient upstream issue worth retrying, not a bad request.
      const msg = (err as Error)?.name === 'AbortError' ? 'timed out' : (err as Error).message
      return json({ error: 'Gemini request failed', detail: `upstream ${msg} — please try again` }, 502)
    }

    if (!geminiRes.ok) {
      const detail = await geminiRes.text()
      return json({ error: 'Gemini request failed', detail }, 502)
    }

    const payload = await geminiRes.json()
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

    let result
    try {
      result = JSON.parse(text)
    } catch {
      return json({ error: 'Could not parse model output', raw: text }, 502)
    }

    // ── Timeframe gate ────────────────────────────────────────────
    // If a chart's actual (detected) timeframe doesn't match the slot the
    // trader selected, DON'T return a rating. Tell them to fix the dropdown.
    const tfArr = Array.isArray(result.timeframes) ? result.timeframes : []
    const mismatches: { slot: string; detected: string }[] = []
    for (const img of images) {
      const label = img.timeframe
      const entry =
        tfArr.find((t: { timeframe?: string }) => normTf(t.timeframe) === normTf(label)) ||
        tfArr[images.indexOf(img)]
      const detected = entry?.detectedTimeframe
      if (
        detected &&
        normTf(detected) !== 'unknown' &&
        normTf(detected) !== '' &&
        normTf(detected) !== normTf(label)
      ) {
        mismatches.push({ slot: label, detected })
      }
    }

    if (mismatches.length > 0) {
      // Blocked before producing a grade — don't consume the free allowance.
      return json({ status: 'timeframe_mismatch', mismatches }, 200)
    }

    // Record a successful analysis in the server-controlled ledger. This is
    // the real free-limit counter (the client can't bypass it).
    await admin.from('usage_events').insert({ user_id: user.id, kind: 'analysis' })

    return json(result, 200)
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
