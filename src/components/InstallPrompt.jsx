import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'
import { useInstall } from '../lib/installState'

const DISMISS_KEY = 'tg_install_dismissed'

export default function InstallPrompt() {
  const { canInstall, isIOS, standalone, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY))

  // Re-show automatically once installable (unless previously dismissed).
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (standalone || dismissed) return setShow(false)
    if (canInstall || isIOS) setShow(true)
  }, [canInstall, isIOS, standalone, dismissed])

  const dismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    const ok = await promptInstall()
    if (ok) dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="glass-strong fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-md items-center gap-3 p-3 md:bottom-4"
        >
          <img src="/pwa-192x192.png" alt="" className="h-11 w-11 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install TradeGradyzer</p>
            {isIOS && !canInstall ? (
              <p className="flex items-center gap-1 text-xs text-white/60">
                Tap <Share size={12} className="inline" /> then “Add to Home Screen”.
              </p>
            ) : (
              <p className="text-xs text-white/60">Add it to your home screen for a full-screen app.</p>
            )}
          </div>

          {canInstall && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              <Download size={15} /> Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
