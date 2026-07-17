import { AnimatePresence, motion } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Coins, X } from 'lucide-react'
import { useUI } from '@/store/ui'

export function Fab() {
  const fabOpen = useUI((s) => s.fabOpen)
  const toggle = useUI((s) => s.toggleFab)
  const openIncome = useUI((s) => s.openIncome)
  const openExpense = useUI((s) => s.openExpense)
  const openTip = useUI((s) => s.openTip)

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:bg-black/20"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[5.5rem] right-5 z-50 flex flex-col items-end gap-3 lg:bottom-7 lg:right-7">
        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.button
                key="income"
                initial={{ opacity: 0, y: 16, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.8 }}
                transition={{ delay: 0.05 }}
                onClick={() => openIncome()}
                className="flex items-center gap-2.5 rounded-full bg-income py-2.5 pl-4 pr-5 font-semibold text-white shadow-card-lg"
              >
                <TrendingUp size={18} /> Ingreso
              </motion.button>
              <motion.button
                key="tip"
                initial={{ opacity: 0, y: 16, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.8 }}
                transition={{ delay: 0.025 }}
                onClick={() => openTip()}
                className="flex items-center gap-2.5 rounded-full bg-[#14b8a6] py-2.5 pl-4 pr-5 font-semibold text-white shadow-card-lg"
              >
                <Coins size={18} /> Propina
              </motion.button>
              <motion.button
                key="expense"
                initial={{ opacity: 0, y: 16, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.8 }}
                onClick={() => openExpense()}
                className="flex items-center gap-2.5 rounded-full bg-expense py-2.5 pl-4 pr-5 font-semibold text-white shadow-card-lg"
              >
                <TrendingDown size={18} /> Gasto
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => toggle()}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: fabOpen ? 135 : 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 320 }}
          className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-contrast shadow-[0_8px_30px_-6px_rgb(var(--c-primary)/0.6)]"
          aria-label="Agregar movimiento"
        >
          {fabOpen ? <X size={24} /> : <Plus size={26} />}
        </motion.button>
      </div>
    </>
  )
}
