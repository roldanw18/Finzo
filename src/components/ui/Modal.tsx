import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Bottom sheet on mobile when true. */
  sheet?: boolean
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  sheet = true,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: sheet ? 60 : 20, scale: sheet ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: sheet ? 60 : 20, scale: sheet ? 1 : 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative z-10 w-full ${maxWidth} max-h-[92vh] overflow-y-auto
              rounded-t-3xl sm:rounded-3xl border border-border bg-surface shadow-card-lg
              ${sheet ? 'sm:mx-4' : 'mx-4'}`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-surface/95 px-5 py-4 backdrop-blur">
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-content"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
