import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToast } from '@/store/toast'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: 'text-income',
  error: 'text-expense',
  info: 'text-info',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 px-3 sm:bottom-4 sm:top-auto sm:right-4 sm:left-auto sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card-lg"
            >
              <Icon size={18} className={COLORS[t.tone]} />
              <span className="flex-1 text-sm text-content">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-subtle transition hover:text-content"
              >
                <X size={15} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
