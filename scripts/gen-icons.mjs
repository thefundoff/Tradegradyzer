// Dependency-free PWA icon generator (uses only Node's zlib).
// Rasterizes the TradeGradyzer mark into opaque PNGs for install/home-screen.
//
//   node scripts/gen-icons.mjs

import { writeFileSync } from 'node:fs'
import zlib from 'node:zlib'

// ── tiny PNG encoder ─────────────────────────────────────────────
const crcTable = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── drawing ──────────────────────────────────────────────────────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const INDIGO = hex('#6366f1')
const CYAN = hex('#22d3ee')
const BG = hex('#0b0f1a')
const lerp = (a, b, t) => a + (b - a) * t

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function genIcon(size, scale) {
  // Mark geometry (normalized 0..1), from the brand line-chart logo.
  const pts = [
    [0.164, 0.664],
    [0.383, 0.477],
    [0.547, 0.602],
    [0.844, 0.258],
  ]
  const stroke0 = 0.075
  const dotR0 = 0.07
  const off = (1 - scale) / 2
  const P = pts.map(([x, y]) => [(x * scale + off) * size, (y * scale + off) * size])
  const half = (stroke0 * scale * size) / 2
  const dotR = dotR0 * scale * size
  const dot = P[P.length - 1]

  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      let r = BG[0]
      let g = BG[1]
      let b = BG[2]

      // line (gradient indigo→cyan across x), anti-aliased
      let dl = Infinity
      for (let s = 0; s < P.length - 1; s++) {
        dl = Math.min(dl, distSeg(x + 0.5, y + 0.5, P[s][0], P[s][1], P[s + 1][0], P[s + 1][1]))
      }
      const lcov = Math.max(0, Math.min(1, half + 0.5 - dl))
      if (lcov > 0) {
        const t = x / size
        r = Math.round(lerp(INDIGO[0], CYAN[0], t) * lcov + r * (1 - lcov))
        g = Math.round(lerp(INDIGO[1], CYAN[1], t) * lcov + g * (1 - lcov))
        b = Math.round(lerp(INDIGO[2], CYAN[2], t) * lcov + b * (1 - lcov))
      }

      // endpoint dot (cyan), on top
      const dd = Math.hypot(x + 0.5 - dot[0], y + 0.5 - dot[1]) - dotR
      const dcov = Math.max(0, Math.min(1, 0.5 - dd))
      if (dcov > 0) {
        r = Math.round(CYAN[0] * dcov + r * (1 - dcov))
        g = Math.round(CYAN[1] * dcov + g * (1 - dcov))
        b = Math.round(CYAN[2] * dcov + b * (1 - dcov))
      }

      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = 255
    }
  }
  return encodePNG(size, rgba)
}

const out = 'public'
const jobs = [
  ['pwa-192x192.png', 192, 0.86],
  ['pwa-512x512.png', 512, 0.86],
  ['maskable-icon-512.png', 512, 0.6], // extra padding for the adaptive-icon safe zone
  ['apple-touch-icon.png', 180, 0.74],
]
for (const [name, size, scale] of jobs) {
  writeFileSync(`${out}/${name}`, genIcon(size, scale))
  console.log('wrote', `${out}/${name}`)
}
console.log('done')
