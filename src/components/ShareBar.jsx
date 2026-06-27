import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, Eye, X as CloseIcon } from 'lucide-react'
import GlassCard from './ui/GlassCard'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import ShareCard from './ShareCard'
import {
  captureBlob,
  downloadBlob,
  nativeShareImage,
  supportsFileShare,
  openX,
  openWhatsApp,
  TIKTOK_URL,
} from '../lib/share'

const Brand = {
  x: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
}

export default function ShareBar({ row }) {
  const cardRef = useRef(null)
  const blobCache = useRef(null)
  const previewUrlRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  const meta = {
    pair: row?.pair || row?.result?.pair || 'My setup',
    score: row?.result?.overallScore ?? row?.score ?? 0,
    grade: row?.result?.confidence || row?.confidence || 'F',
    bias: row?.result?.bias || 'neutral',
  }

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const getBlob = async () => {
    if (blobCache.current) return blobCache.current
    const blob = await captureBlob(cardRef.current)
    blobCache.current = blob
    return blob
  }

  const fileName = `tradegradyzer-${meta.pair.replace(/\W+/g, '-').toLowerCase()}.png`

  const run = async (action, fn) => {
    setBusy(action)
    try {
      await fn()
    } catch (e) {
      if (e?.name !== 'AbortError') flash(e.message || 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const handlePreview = () =>
    run('preview', async () => {
      const blob = await getBlob()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url
      setPreviewUrl(url)
    })

  const closePreview = () => {
    setPreviewUrl(null)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  const handleDownload = () =>
    run('download', async () => {
      downloadBlob(await getBlob(), fileName)
      flash('Image saved to your device.')
    })

  const handleShare = () =>
    run('share', async () => {
      const blob = await getBlob()
      const shared = await nativeShareImage(blob, meta)
      if (!shared) {
        downloadBlob(blob, fileName)
        flash('Sharing not supported here — image saved instead.')
      }
    })

  const handleX = () =>
    run('x', async () => {
      openX(meta) // sync first — keeps the click's user-activation for the popup
      downloadBlob(await getBlob(), fileName)
      flash('Image saved — attach it to your post on X.')
    })

  const handleWhatsApp = () =>
    run('whatsapp', async () => {
      if (supportsFileShare()) {
        await nativeShareImage(await getBlob(), meta)
        return
      }
      openWhatsApp(meta) // sync (desktop path)
      downloadBlob(await getBlob(), fileName)
      flash('Image saved — attach it in WhatsApp.')
    })

  const handleTikTok = () =>
    run('tiktok', async () => {
      if (supportsFileShare()) {
        await nativeShareImage(await getBlob(), meta)
        return
      }
      window.open(TIKTOK_URL, '_blank', 'noopener') // sync (desktop path)
      downloadBlob(await getBlob(), fileName)
      flash('Image saved — upload it to TikTok as a photo post.')
    })

  const iconBtn =
    'grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border-hover)] text-white/80 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40'

  const Actions = () => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="ghost" size="md" onClick={handleDownload} disabled={!!busy}>
        {busy === 'download' ? <Spinner /> : <Download size={16} />} Download
      </Button>
      <Button size="md" onClick={handleShare} disabled={!!busy}>
        {busy === 'share' ? <Spinner /> : <Share2 size={16} />} Share
      </Button>
      <div className="mx-1 h-6 w-px bg-[var(--color-border)]" />
      <button className={iconBtn} onClick={handleX} disabled={!!busy} title="Share to X" aria-label="Share to X">
        {busy === 'x' ? <Spinner size={16} /> : Brand.x}
      </button>
      <button className={iconBtn} onClick={handleWhatsApp} disabled={!!busy} title="Share to WhatsApp" aria-label="Share to WhatsApp">
        {busy === 'whatsapp' ? <Spinner size={16} /> : Brand.whatsapp}
      </button>
      <button className={iconBtn} onClick={handleTikTok} disabled={!!busy} title="Share to TikTok" aria-label="Share to TikTok">
        {busy === 'tiktok' ? <Spinner size={16} /> : Brand.tiktok}
      </button>
    </div>
  )

  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium">Share your grade</p>
          <p className="text-sm text-white/50">Preview the card, download it, or post to your socials.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="md" onClick={handlePreview} disabled={!!busy}>
            {busy === 'preview' ? <Spinner /> : <Eye size={16} />} Preview
          </Button>
          <Actions />
        </div>
      </div>

      {/* Off-screen capture target — clipped, NOT offset (offset breaks capture) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <ShareCard ref={cardRef} row={row} />
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong flex max-h-[92vh] w-full max-w-sm flex-col gap-4 overflow-y-auto p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">Preview</p>
                <button onClick={closePreview} className="rounded-lg p-1 text-white/60 hover:bg-white/5 hover:text-white">
                  <CloseIcon size={18} />
                </button>
              </div>
              <img
                src={previewUrl}
                alt="Share card preview"
                className="w-full rounded-lg border border-[var(--color-border)]"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Actions />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-strong fixed inset-x-0 bottom-24 z-[60] mx-auto w-fit max-w-[90vw] px-4 py-2.5 text-sm text-white md:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
