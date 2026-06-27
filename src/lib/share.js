import { toBlob, toPng } from 'html-to-image'

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://tradegradyzer.app'

const CAPTURE_OPTS = { pixelRatio: 2, cacheBust: true, backgroundColor: '#000000' }

async function ready() {
  // Web fonts must be loaded or text won't render in the export.
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
  // Let layout/paint settle for one frame.
  await new Promise((r) => requestAnimationFrame(() => r()))
}

/** Capture a DOM node to a PNG Blob at high resolution. */
export async function captureBlob(node) {
  if (!node) throw new Error('Nothing to capture.')
  await ready()
  // html-to-image's first pass can come back blank while resources warm up;
  // a throwaway pass makes the real one reliable.
  await toBlob(node, CAPTURE_OPTS)
  const blob = await toBlob(node, CAPTURE_OPTS)
  if (!blob) throw new Error('Could not generate the image.')
  return blob
}

export async function captureDataUrl(node) {
  if (!node) throw new Error('Nothing to capture.')
  await ready()
  await toPng(node, CAPTURE_OPTS)
  return toPng(node, CAPTURE_OPTS)
}

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Build the share caption. */
export function shareText({ pair, score, grade, bias }) {
  return (
    `📈 ${pair || 'My setup'} graded ${score}% (${grade}) on TradeGradyzer — ${bias} bias.\n` +
    `AI-scored my chart setup in seconds.`
  )
}

/** True if the browser can share files (mobile / PWA). */
export function canShareFiles(blob) {
  try {
    const file = new File([blob], 'card.png', { type: 'image/png' })
    return !!navigator.canShare && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * Synchronous capability probe (no Blob needed) — lets handlers decide,
 * *before* any await, whether to use the native sheet or open a web intent.
 * This preserves the click's user-activation so popups aren't blocked.
 */
export function supportsFileShare() {
  try {
    const file = new File([new Blob()], 'card.png', { type: 'image/png' })
    return !!navigator.canShare && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * Native OS share sheet with the image attached. Best path on mobile —
 * lets the user pick X, WhatsApp, TikTok, etc. with the picture included.
 * Returns true if the share dialog was invoked.
 */
export async function nativeShareImage(blob, meta) {
  const file = new File([blob], `tradegradyzer-${(meta.pair || 'setup').replace(/\W+/g, '-')}.png`, {
    type: 'image/png',
  })
  if (navigator.share && canShareFiles(blob)) {
    await navigator.share({
      files: [file],
      title: 'TradeGradyzer',
      text: shareText(meta),
    })
    return true
  }
  return false
}

/* ── Per-platform fallbacks (open the app/site with prefilled text) ──
   Web share intents can't attach an image, so the caller downloads the
   PNG first, then we open the composer with the caption + link. */

export function openX(meta) {
  const text = encodeURIComponent(shareText(meta))
  const url = encodeURIComponent(APP_URL)
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener')
}

export function openWhatsApp(meta) {
  const text = encodeURIComponent(`${shareText(meta)}\n${APP_URL}`)
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
}

/** TikTok has no web share URL — the flow is download-then-upload. */
export const TIKTOK_URL = 'https://www.tiktok.com/upload'
