import { useEffect, useReducer } from 'react'

// Capture the install prompt as early as possible — the `beforeinstallprompt`
// event can fire before React mounts, so we listen at module load and stash it.
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)
}

/** Trigger the native install dialog if we captured one. Returns true if shown. */
export async function promptInstall() {
  if (!deferred) return false
  deferred.prompt()
  await deferred.userChoice.catch(() => {})
  deferred = null
  notify()
  return true
}

/** React hook: re-renders when install availability changes. */
export function useInstall() {
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    listeners.add(force)
    return () => listeners.delete(force)
  }, [])
  return {
    canInstall: !!deferred,
    isIOS: isIOS(),
    standalone: isStandalone(),
    promptInstall,
  }
}
