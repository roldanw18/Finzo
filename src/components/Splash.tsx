import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

export function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-contrast shadow-glow"
        >
          <Wallet size={32} strokeWidth={2.4} />
        </motion.div>
        <div className="text-center">
          <p className="font-display text-xl font-bold">Finzo</p>
          <p className="text-sm text-muted">Cargando tus finanzas…</p>
        </div>
      </div>
    </div>
  )
}
