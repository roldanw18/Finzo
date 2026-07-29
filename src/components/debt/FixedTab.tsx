import { Plus, Pencil, Repeat, CalendarClock, CheckCircle2, Power } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { useDebt } from '@/hooks/useDebt'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { useDebtModal } from './modalContext'
import { toast } from '@/store/toast'
import { todayISO, fmt } from '@/lib/dates'
import { nextMonthlyDate } from '@/lib/debt'
import { cn } from '@/lib/utils'

export function FixedTab() {
  const { fixedExpenses, dailyTargets } = useDebt()
  const { costLabel } = useActivity()
  const { money } = useMoney()
  const { t } = useI18n()
  const open = useDebtModal()
  const addExpense = useStore((s) => s.addExpense)
  const editFixedExpense = useStore((s) => s.editFixedExpense)
  const expenses = useStore((s) => s.expenses)

  const active = fixedExpenses.filter((f) => f.active)
  const monthKey = todayISO().slice(0, 7)

  const paidThisMonth = (name: string, categoryId: string | null) =>
    expenses.some(
      (e) =>
        e.date.slice(0, 7) === monthKey &&
        e.description === `Pago fijo: ${name}` &&
        (categoryId === null || e.category_id === categoryId),
    )

  async function registerPayment(f: (typeof fixedExpenses)[number]) {
    try {
      await addExpense({
        amount: f.amount,
        category_id: f.category_id,
        date: todayISO(),
        description: `Pago fijo: ${f.name}`,
        payment_method: 'transfer',
        notes: 'Gasto fijo mensual',
      })
      toast.success(t('Pago de {name} registrado').replace('{name}', f.name))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{t('Total de gastos fijos al mes')}</p>
          <p className="tnum font-display text-2xl font-bold text-content">
            {money(dailyTargets.fixedTotal)}
          </p>
        </div>
        <button onClick={() => open({ type: 'fixed' })} className="btn-primary">
          <Plus size={16} /> {t('Gasto fijo')}
        </button>
      </div>

      {dailyTargets.fixedTotal > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-income/25 bg-income/[0.07] p-4">
          <Repeat size={18} className="mt-0.5 shrink-0 text-income" />
          <p className="text-sm text-content">
            {t('Para cubrir solo tus gastos fijos necesitas producir {m}/día (incluye {c} ×{f}).')
              .split('{m}')
              .map((seg, i) =>
                i === 0 ? (
                  seg
                ) : (
                  <span key={i}>
                    <b className="text-income">{money(dailyTargets.fixedNetPerDay * dailyTargets.costFactor)}{t('/día')}</b>
                    {seg.replace('{c}', costLabel.toLowerCase()).replace('{f}', String(dailyTargets.costFactor))}
                  </span>
                ),
              )}
          </p>
        </div>
      )}

      {active.length === 0 && fixedExpenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat size={22} />}
            title={t('Agrega tus gastos fijos')}
            description={t('Arriendo, servicios, internet, celular, suscripciones… para saber cuánto necesitas cada mes.')}
            action={
              <button onClick={() => open({ type: 'fixed' })} className="btn-primary mt-1">
                <Plus size={16} /> {t('Agregar gasto fijo')}
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {fixedExpenses.map((f) => {
            const paid = paidThisMonth(f.name, f.category_id)
            return (
              <div
                key={f.id}
                className={cn('card flex items-center gap-3 p-4', !f.active && 'opacity-60')}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8b5cf6]/15 text-[#8b5cf6]">
                  <Repeat size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-content">{f.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    {f.due_day ? (
                      <>
                        <CalendarClock size={12} />{' '}
                        {t('vence el {d} · próx. {date}')
                          .replace('{d}', String(f.due_day))
                          .replace('{date}', fmt(nextMonthlyDate(f.due_day, new Date()).toISOString().slice(0, 10), "d 'de' MMM"))}
                      </>
                    ) : (
                      t('Sin día de pago')
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tnum font-display text-base font-bold text-content">
                    {money(f.amount)}
                  </p>
                  {paid ? (
                    <span className="chip bg-income/12 text-[10px] font-semibold text-income">
                      <CheckCircle2 size={11} /> {t('pagado')}
                    </span>
                  ) : f.active ? (
                    <button
                      onClick={() => registerPayment(f)}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {t('Registrar pago')}
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => open({ type: 'fixed', editing: f })}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:text-content"
                    title={t('Editar')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => editFixedExpense(f.id, { active: !f.active })}
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-lg transition',
                      f.active ? 'text-subtle hover:text-expense' : 'text-income',
                    )}
                    title={f.active ? t('Desactivar') : t('Activar')}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
