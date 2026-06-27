import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, X, ImageIcon } from 'lucide-react'

export default function ChartUploader({ badge, file, onChange }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (f) => {
    if (f && f.type.startsWith('image/')) onChange(f)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        pick(e.dataTransfer.files?.[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`glass relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
        dragOver ? 'border-white/50 bg-white/5' : 'border-[var(--color-border-hover)]'
      }`}
    >
      {preview ? (
        <>
          <img src={preview} alt={`${badge} chart`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] text-white/80">
            <ImageIcon size={12} /> {String(badge).toUpperCase()}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center text-white/50">
          <UploadCloud size={28} className="text-white/70" />
          <span className="text-xs">Tap or drop your {String(badge).toUpperCase()} screenshot</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </motion.div>
  )
}
