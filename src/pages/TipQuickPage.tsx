import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Coins } from 'lucide-react'
import { TipForm } from '@/components/forms/TipForm'

export function TipQuickPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#14b8a6]/15 text-[#14b8a6]">
              <Coins size={22} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold leading-none">Propina rápida</h1>
              <p className="text-xs text-subtle">Registra y listo</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted transition active:scale-95"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 flex-1"
        >
          <TipForm />
        </motion.div>

        <button
          onClick={() => navigate('/')}
          className="mt-4 text-center text-sm text-muted hover:text-content"
        >
          Ir al inicio →
        </button>
      </div>
    </div>
  )
}
