import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Coins, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { TipForm } from '@/components/forms/TipForm'
import { IncomeForm } from '@/components/forms/IncomeForm'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { useI18n } from '@/i18n'

export type QuickKind = 'tip' | 'income' | 'expense'

const META: Record<QuickKind, { icon: LucideIcon; accent: string; title: string; subtitle: string }> = {
  tip: { icon: Coins, accent: 'bg-[#14b8a6]/15 text-[#14b8a6]', title: 'Propina rápida', subtitle: 'Registra y listo' },
  income: { icon: TrendingUp, accent: 'bg-income/15 text-income', title: 'Ingreso rápido', subtitle: 'Registra y listo' },
  expense: { icon: TrendingDown, accent: 'bg-expense/15 text-expense', title: 'Gasto rápido', subtitle: 'Registra y listo' },
}

/** Full-screen single-purpose entry screen — a deep-link / iOS home-screen shortcut target. */
export function QuickEntry({ kind }: { kind: QuickKind }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const meta = META[kind]
  const Icon = meta.icon
  const goHome = () => navigate('/')

  return (
    <div className="min-h-screen bg-bg px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${meta.accent}`}>
              <Icon size={22} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold leading-none">{t(meta.title)}</h1>
              <p className="text-xs text-subtle">{t(meta.subtitle)}</p>
            </div>
          </div>
          <button
            onClick={goHome}
            className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted transition active:scale-95"
            aria-label={t('Cerrar')}
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
          {kind === 'tip' && <TipForm />}
          {kind === 'income' && <IncomeForm onDone={goHome} />}
          {kind === 'expense' && <ExpenseForm onDone={goHome} />}
        </motion.div>

        <button
          onClick={goHome}
          className="mt-4 text-center text-sm text-muted hover:text-content"
        >
          {t('Ir al inicio →')}
        </button>
      </div>
    </div>
  )
}
