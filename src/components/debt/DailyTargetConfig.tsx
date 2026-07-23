import { CreditCard, Repeat, Info, Gauge, Wallet, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { usePrefs } from '@/store/prefs'
import { useDebt } from '@/hooks/useDebt'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { applyAvailableToTarget } from '@/lib/debt'
import { debtTypeMeta } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Interactive configurator for the daily income goal: work days per week and
 * which obligations to include. Everything persists and recalculates live.
 */
export function DailyTargetConfig({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dailyTargets: dt, active, fixedExpenses } = useDebt()
  const { kpis } = useAnalytics()
  const { costLabel } = useActivity()
  const { money } = useMoney()
  const saveProfile = useStore((s) => s.saveProfile)
  const editDebt = useStore((s) => s.editDebt)
  const editFixedExpense = useStore((s) => s.editFixedExpense)
  const workDays = useStore((s) => s.profile?.work_days_per_week ?? 7)

  const activeFixed = fixedExpenses.filter((f) => f.active)

  // Optional: apply your available cash to the obligations first (persisted).
  const useAvailable = usePrefs((s) => s.useAvailableInTarget)
  const setUseAvailable = usePrefs((s) => s.setUseAvailableInTarget)
  const available = Math.max(0, kpis.available)
  const applied = applyAvailableToTarget(dt, available, useAvailable)
  const remainingObligation = applied.remaining
  const shownPerDay = dt.totalPerDay * applied.ratio
  const fullyCovered = applied.fullyCovered

  return (
    <Modal open={open} onClose={onClose} title="Configurar meta diaria" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Live result */}
        <div className="rounded-2xl border border-income/25 bg-income/[0.07] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gauge size={20} className="text-income" />
              <span className="text-sm text-muted">
                {fullyCovered ? 'Ya lo cubres' : 'Debes producir'}
              </span>
            </div>
            {fullyCovered ? (
              <CheckCircle2 size={22} className="text-income" />
            ) : (
              <span className="tnum font-display text-2xl font-bold text-income">
                {money(shownPerDay)}
                <span className="ml-1 text-sm font-medium text-muted">
                  /día{workDays < 7 ? ' trab.' : ''}
                </span>
              </span>
            )}
          </div>
          {useAvailable && (
            <p className="mt-2 border-t border-income/20 pt-2 text-xs text-content">
              {fullyCovered ? (
                <span className="text-income">
                  Tu dinero disponible ({money(available)}) cubre todas tus obligaciones de este
                  ciclo. 🎉
                </span>
              ) : (
                <>
                  Usando tu disponible ({money(available)}), aún te falta producir{' '}
                  <b className="text-content">{money(remainingObligation)}</b> en total.
                </>
              )}
            </p>
          )}
        </div>

        {/* Toggle: use available cash */}
        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-3.5">
          <span className="flex items-start gap-2.5">
            <Wallet size={18} className="mt-0.5 shrink-0 text-info" />
            <span>
              <span className="block text-sm font-medium text-content">
                Contar con mi dinero disponible
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                Resta tus {money(available, { compact: true })} disponibles de las obligaciones y
                recalcula cuánto te falta producir.
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={useAvailable}
            onChange={(e) => setUseAvailable(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-income"
          />
        </label>

        {/* How it's calculated */}
        <div className="flex items-start gap-2.5 rounded-xl bg-surface-2/60 p-3.5">
          <Info size={16} className="mt-0.5 shrink-0 text-info" />
          <p className="text-xs leading-relaxed text-muted">
            <b className="text-content">Cómo se calcula:</b> de cada obligación tomo lo que
            falta pagar, lo reparto entre los <b className="text-content">días que trabajas</b>{' '}
            hasta su fecha de pago, sumo todo y lo multiplico por tu factor de{' '}
            {costLabel.toLowerCase()} (×{dt.costFactor}). Así, tras cubrir tus costos, te queda
            libre justo lo de tus obligaciones.
          </p>
        </div>

        {/* Work days */}
        <div>
          <label className="label">¿Cuántos días trabajas por semana?</label>
          <p className="mb-2 text-xs text-muted">
            Si descansas, reparto tus obligaciones solo entre los días que produces (la meta
            por día sube).
          </p>
          <div className="flex flex-wrap gap-2">
            {[4, 5, 6, 7].map((d) => (
              <button
                key={d}
                onClick={() => saveProfile({ work_days_per_week: d })}
                className={cn(
                  'chip border px-3.5 py-2 text-sm font-medium transition',
                  workDays === d
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-surface-2 text-content hover:bg-surface-3',
                )}
              >
                {d === 7 ? 'Todos (7)' : `${d} días`}
              </button>
            ))}
          </div>
        </div>

        {/* Include debts */}
        {active.length > 0 && (
          <div>
            <label className="label">Deudas que cuentan</label>
            <div className="space-y-1.5">
              {active.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2/50 p-2.5"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `${debtTypeMeta(d.type).color}22`,
                      color: debtTypeMeta(d.type).color,
                    }}
                  >
                    <CreditCard size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{d.name}</p>
                    <p className="text-xs text-muted">
                      mín {money(d.min_payment, { compact: true })}
                      {d.due_day ? ` · vence el ${d.due_day}` : ''}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={d.count_in_target !== false}
                    onChange={(e) => editDebt(d.id, { count_in_target: e.target.checked })}
                    className="h-5 w-5 shrink-0 accent-income"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Include fixed expenses */}
        {activeFixed.length > 0 && (
          <div>
            <label className="label">Gastos fijos que cuentan</label>
            <div className="space-y-1.5">
              {activeFixed.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2/50 p-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6]">
                    <Repeat size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{f.name}</p>
                    <p className="text-xs text-muted">
                      {money(f.amount, { compact: true })}/mes
                      {f.due_day ? ` · vence el ${f.due_day}` : ''}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={f.count_in_target !== false}
                    onChange={(e) =>
                      editFixedExpense(f.id, { count_in_target: e.target.checked })
                    }
                    className="h-5 w-5 shrink-0 accent-income"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {active.length === 0 && activeFixed.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            Agrega deudas o gastos fijos para calcular tu meta diaria.
          </p>
        )}

        <button onClick={onClose} className="btn-primary w-full">
          Listo
        </button>
      </div>
    </Modal>
  )
}
