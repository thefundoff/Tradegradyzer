import { forwardRef } from 'react'
import { LineChart } from 'lucide-react'
import { CONFIDENCE } from '../lib/constants'

function gradeColor(score) {
  if (score >= 85) return '#4ade80'
  if (score >= 70) return '#5e8bff'
  if (score >= 50) return '#f5c451'
  return '#ff5c5c'
}

const biasColor = { bullish: '#4ade80', bearish: '#ff5c5c', neutral: '#f5c451' }

/**
 * A self-contained, branded 1080×1350 card designed for capture to PNG and
 * sharing. Uses inline styles so the export looks identical everywhere.
 * Rendered off-screen by the parent; never shown inline.
 */
const ShareCard = forwardRef(function ShareCard({ row }, ref) {
  const r = row?.result || {}
  const score = r.overallScore ?? row?.score ?? 0
  const grade = r.confidence || row?.confidence || 'F'
  const bias = r.bias || 'neutral'
  const pair = row?.pair || r.pair || 'Setup'
  const color = gradeColor(score)
  const gradeMeta = CONFIDENCE[grade] || CONFIDENCE.F

  const size = 360
  const stroke = 26
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100)

  const summary = (r.summary || '').slice(0, 200)
  const entry = r.entry?.price ?? '—'
  const sl = r.stopLoss ?? '—'
  const tp = r.takeProfit ?? '—'

  const generatedAt = new Date(row?.created_at || Date.now()).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const stat = (label, value, c = '#ededed') => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 22, letterSpacing: 2, color: '#8f8f8f', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 44, fontWeight: 700, color: c, marginTop: 8 }}>{value}</div>
    </div>
  )

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: 1080,
        height: 1350,
        background: '#000',
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        color: '#ededed',
        fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
        padding: 72,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <LineChart size={32} color="#000" />
          </div>
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.5 }}>TradeGradyzer</span>
        </div>
        <span style={{ fontSize: 22, letterSpacing: 3, color: '#8f8f8f', textTransform: 'uppercase' }}>
          AI Setup Grade
        </span>
      </div>

      {/* Pair */}
      <div style={{ marginTop: 64 }}>
        <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{pair}</div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 20,
            padding: '8px 18px',
            borderRadius: 999,
            border: `1px solid ${biasColor[bias]}55`,
            background: `${biasColor[bias]}18`,
            color: biasColor[bias],
            fontSize: 26,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {bias} bias
        </div>
      </div>

      {/* Score ring + grade */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 56, marginTop: 56 }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 96, fontWeight: 800, color }}>{Math.round(score)}%</span>
            <span style={{ fontSize: 22, letterSpacing: 3, color: '#8f8f8f', textTransform: 'uppercase' }}>
              Setup score
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 28,
              display: 'grid',
              placeItems: 'center',
              fontSize: 88,
              fontWeight: 800,
              color: gradeMeta.color,
              background: `${gradeMeta.color}1f`,
              border: `2px solid ${gradeMeta.color}66`,
            }}
          >
            {gradeMeta.label}
          </div>
          <div style={{ fontSize: 26, color: '#a1a1a1', marginTop: 20, maxWidth: 380 }}>
            {gradeMeta.desc}
          </div>
        </div>
      </div>

      {/* Trade plan */}
      <div
        style={{
          display: 'flex',
          marginTop: 56,
          padding: '28px 0',
          borderTop: '1px solid #1f1f1f',
          borderBottom: '1px solid #1f1f1f',
        }}
      >
        {stat('Entry', entry, '#ffffff')}
        <div style={{ width: 1, background: '#1f1f1f' }} />
        {stat('Stop', sl, '#ff5c5c')}
        <div style={{ width: 1, background: '#1f1f1f' }} />
        {stat('Target', tp, '#4ade80')}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ marginTop: 36, fontSize: 28, lineHeight: 1.5, color: '#a1a1a1' }}>
          {summary}
          {r.summary && r.summary.length > 200 ? '…' : ''}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 24, color: '#8f8f8f' }}>Graded by TradeGradyzer · AI chart analysis</span>
          <span style={{ fontSize: 22, color: '#5a5a5a' }}>Generated {generatedAt}</span>
        </div>
        <span style={{ fontSize: 24, color: '#5a5a5a' }}>Not financial advice</span>
      </div>
    </div>
  )
})

export default ShareCard
