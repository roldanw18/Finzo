import { motion } from 'framer-motion'
import { Plus, Target, Pencil, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { useDebtModal } from './modalContext'
import { goalProgress } from '@/lib/debt'
import { toast } from '@/store/toast'

export function GoalsTab() {
  const { goals, debts, active } = useDebt()
  const { money } = useMoney()
  const { t } = useI18n()
  const open = useDebtModal()
  const addGoal = useStore((s) => s.addGoal)

  const hasCards = debts.some((d) => d.type === 'credit_card')

  async function quickGoal(fn: () => Parameters<typeof addGoal>[0]) {
    try {
      await addGoal(fn())
      toast.success(t('Meta creada ✓'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const suggestions = [
    ...active.slice(0, 3).map((d) => {
      const label = t('Salir de {name}').replace('{name}', d.name)
      return {
        label,
        make: () => ({ name: label, kind: 'debt' as const, debt_id: d.id, debt_type: null, target_date: null }),
      }
    }),
    ...(hasCards
      ? [{ label: t('Salir de todas las tarjetas'), make: () => ({ name: t('Salir de todas las tarjetas'), kind: 'type' as const, debt_type: 'credit_card' as const, debt_id: null, target_date: null }) }]
      : []),
    { label: t('Quedar libre de deudas'), make: () => ({ name: t('Libre de deudas'), kind: 'all' as const, debt_type: null, debt_id: null, target_date: null }) },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t('Mis metas')}</h2>
        <button onClick={() => open({ type: 'goal' })} className="btn-primary">
          <Plus size={16} /> {t('Nueva meta')}
        </button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => quickGoal(s.make)}
            className="chip border border-dashed border-border bg-surface-2/50 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary/50 hover:text-primary"
          >
            <Plus size={12} /> {s.label}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={22} />}
            title={t('Crea tu primera meta')}
            description={t("Ponte objetivos como 'Salir de NU' o 'Libre de deudas' y sigue tu avance.")}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const p = goalProgress(g, debts)
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {p.done ? (
                      <CheckCircle2 size={18} className="text-income" />
                    ) : (
                      <Target size={18} className="text-primary" />
                    )}
                    <p className="font-semibold text-content">{g.name}</p>
                  </div>
                  <button
                    onClick={() => open({ type: 'goal', editing: g })}
                    className="text-subtle transition hover:text-content"
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="tnum font-bold text-primary">{p.pct.toFixed(0)}%</span>
                    <span className="text-xs text-muted">
                      {p.done ? t('¡Completada!') : `${t('Faltan')} ${money(p.moneyLeft, { compact: true })}`}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, p.pct)}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-income"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{t('{n} deuda(s)').replace('{n}', String(p.debtsCount))}</span>
                  {p.daysLeft !== null && (
                    <span className={p.daysLeft < 0 ? 'text-expense' : ''}>
                      {p.daysLeft < 0
                        ? t('{d}d de retraso').replace('{d}', String(Math.abs(p.daysLeft)))
                        : t('{d} días restantes').replace('{d}', String(p.daysLeft))}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
