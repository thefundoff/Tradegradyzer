import { supabase } from './supabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_ANALYZER === 'true'
const FUNCTION_NAME = import.meta.env.VITE_ANALYZE_FUNCTION || 'analyze-chart'

/** Read a File/Blob into a base64 string (no data: prefix). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze a set of timeframe charts.
 * @param {{ '4h'?: File, '1h'?: File, '30m'?: File }} files
 * @param {{ pair?: string, notes?: string }} meta
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeCharts(files, meta = {}) {
  const entries = await Promise.all(
    Object.entries(files)
      .filter(([, f]) => f)
      .map(async ([tf, f]) => ({
        timeframe: tf,
        mimeType: f.type || 'image/png',
        data: await fileToBase64(f),
      })),
  )

  if (entries.length === 0) {
    throw new Error('Please upload at least one chart.')
  }

  if (USE_MOCK) {
    return mockAnalyze(entries, meta)
  }

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      images: entries,
      pair: meta.pair || '',
      notes: meta.notes || '',
      calibration: meta.calibration || null,
    },
  })

  if (error) {
    throw new Error(error.message || 'Analysis failed. Please try again.')
  }
  // The function may block instead of rating — pass these statuses through:
  //  - timeframe_mismatch: a chart's real timeframe doesn't match its slot
  //  - limit_reached: free allowance used up (server-enforced)
  //  - rate_limited: too many analyses in a short window
  if (data?.status) return data
  return normalizeResult(data)
}

/** Ensure the shape is consistent regardless of small model deviations. */
export function normalizeResult(raw) {
  const r = raw || {}
  const score = clamp(Math.round(Number(r.overallScore) || 0), 10, 100)
  return {
    overallScore: score,
    confidence: ['A+', 'B', 'C', 'F'].includes(r.confidence) ? r.confidence : gradeFromScore(score),
    bias: r.bias || 'neutral',
    pair: r.pair || '',
    summary: r.summary || '',
    entry: r.entry || null,
    stopLoss: r.stopLoss ?? null,
    takeProfit: r.takeProfit ?? null,
    riskReward: r.riskReward ?? null,
    timeframes: Array.isArray(r.timeframes) ? r.timeframes : [],
    warnings: Array.isArray(r.warnings) ? r.warnings : [],
  }
}

function gradeFromScore(s) {
  if (s >= 85) return 'A+'
  if (s >= 70) return 'B'
  if (s >= 50) return 'C'
  return 'F'
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/* ── Mock analyzer (no API key required) ─────────────────────── */
function mockAnalyze(entries, meta) {
  const score = 40 + Math.floor(Math.random() * 55)
  const bias = Math.random() > 0.5 ? 'bullish' : 'bearish'
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        normalizeResult({
          overallScore: score,
          confidence: gradeFromScore(score),
          bias,
          pair: meta.pair || 'BTC/USDT',
          summary:
            `Mock analysis — ${bias} structure aligning across timeframes. ` +
            `Higher timeframe shows a clear trend with a pullback into a demand zone. ` +
            `Set VITE_USE_MOCK_ANALYZER=false and deploy the edge function for real Gemini analysis.`,
          entry: { price: 100.5, type: 'limit', rationale: 'Retest of broken structure / order block.' },
          stopLoss: 98.2,
          takeProfit: 106.8,
          riskReward: 2.6,
          warnings: score < 55 ? ['Setup is marginal — wait for confirmation candle.'] : [],
          timeframes: entries.map((e) => ({
            timeframe: e.timeframe,
            detectedTimeframe: e.timeframe,
            readability: 'clear',
            trend: bias,
            comment: `Mock ${e.timeframe} read: structure favours ${bias} continuation.`,
            keyLevels: [
              { type: 'resistance', price: 106.8, yNorm: 0.18, strength: 'strong', label: 'Supply' },
              { type: 'support', price: 100.5, yNorm: 0.55, strength: 'strong', label: 'Demand / entry' },
              { type: 'support', price: 98.2, yNorm: 0.78, strength: 'medium', label: 'Invalidation' },
            ],
            entryZone: { yNorm: 0.55, price: 100.5 },
          })),
        }),
      )
    }, 1400)
  })
}
