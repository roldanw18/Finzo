import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Check, TrendingUp, TrendingDown, PiggyBank, ChevronRight, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

const DISMISS_KEY = 'finzo:firstSteps:dismissed'

/**
 * Getting-started checklist for new users. Shows on the dashboard until the
 * three core actions are done (or the user hides it), then disappears for good.
 */
export function FirstStepsCard() {
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const savingsGoals = useStore((s) => s.savingsGoals)
  const openIncome = useUI((s) => s.openIncome)
  const openExpense = useUI((s) => s.openExpense)
  const { t } = useI18n()

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const steps = [
    { done: incomes.length > 0, label: t('Registra tu primer ingreso'), icon: TrendingUp, onClick: () => openIncome() },
    { done: expenses.length > 0, label: t('Registra tu primer gasto'), icon: TrendingDown, onClick: () => openExpense() },
    { done: savingsGoals.length > 0, label: t('Crea una meta de ahorro'), icon: PiggyBank, to: '/ahorro' },
  ]
  const doneCount = steps.filter((s) => s.done).length

  if (dismissed || doneCount === steps.length) return null

  function hide() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-surface p-5"
    >
      <button
        onClick={hide}
        aria-label={t('Ocultar')}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-subtle transition hover:bg-surface-2 hover:text-content"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Rocket size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">{t('Primeros pasos')}</h2>
          <p className="text-xs text-muted">
            {t('Haz esto para empezar con buen pie')} · {doneCount}/{steps.length}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const rowClass = cn(
            'flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-3 py-2.5 text-left transition',
            !step.done && 'hover:bg-surface-2',
          )
          const inner = (
            <>
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                  step.done ? 'bg-income/15 text-income' : 'bg-surface-2 text-muted',
                )}
              >
                {step.done ? <Check size={18} /> : <Icon size={17} />}
              </span>
              <span className={cn('flex-1 text-sm font-medium', step.done ? 'text-muted line-through' : 'text-content')}>
                {step.label}
              </span>
              {!step.done && <ChevronRight size={16} className="text-subtle" />}
            </>
          )
          if (step.done) return <div key={i} className={rowClass}>{inner}</div>
          return step.to ? (
            <Link key={i} to={step.to} className={rowClass}>
              {inner}
            </Link>
          ) : (
            <button key={i} onClick={step.onClick} className={cn(rowClass, 'w-full')}>
              {inner}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
