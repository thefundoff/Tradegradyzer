/*
 * k6 load test for TradeGradyzer read paths (auth + PostgREST reads).
 *
 * ⚠️  Run against a STAGING Supabase project, never production, and do NOT
 *     point this at analyze-chart (it costs Gemini money + is rate-limited).
 *
 * Setup:
 *   1. Install k6: https://k6.io/docs/get-started/installation/
 *   2. Create a staging project + a test user, then export env vars:
 *        export SB_URL="https://YOUR-STAGING.supabase.co"
 *        export SB_ANON="staging-anon-key"
 *        export TEST_EMAIL="loadtest@example.com"
 *        export TEST_PASSWORD="..."
 *   3. Run:  k6 run loadtest/k6-read-paths.js
 *      Cloud/distributed:  k6 cloud loadtest/k6-read-paths.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

const SB_URL = __ENV.SB_URL
const SB_ANON = __ENV.SB_ANON
const EMAIL = __ENV.TEST_EMAIL
const PASSWORD = __ENV.TEST_PASSWORD

export const options = {
  scenarios: {
    // Gradual ramp to find where latency degrades.
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<800'], // 95% under 800ms
  },
}

function login() {
  const res = http.post(
    `${SB_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { apikey: SB_ANON, 'Content-Type': 'application/json' } },
  )
  check(res, { 'login 200': (r) => r.status === 200 })
  return res.json('access_token')
}

export function setup() {
  return { token: login() }
}

export default function (data) {
  const headers = { apikey: SB_ANON, Authorization: `Bearer ${data.token}` }

  // Dashboard / history read (RLS-protected list)
  const list = http.get(
    `${SB_URL}/rest/v1/analyses?select=id,pair,score,confidence,outcome,created_at&order=created_at.desc&limit=20`,
    { headers },
  )
  check(list, { 'list ok': (r) => r.status === 200 })

  // Performance aggregate read
  const perf = http.get(`${SB_URL}/rest/v1/analyses?select=confidence,outcome,outcome_rr`, { headers })
  check(perf, { 'perf ok': (r) => r.status === 200 })

  sleep(Math.random() * 2 + 1) // think time 1–3s
}
