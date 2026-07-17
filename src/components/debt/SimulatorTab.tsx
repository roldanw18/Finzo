import { useMemo, useState } from 'react'
import { Zap, TrendingDown, CalendarClock, Sparkles, PiggyBank } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { AmountInput } from '@/components/ui/AmountInput'
import { LineTrend } from '@/components/charts/LineTrend'
import { useDebt } from '@/hooks/useDebt'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'
import { compareExtra, simulatePayoff } from '@/lib/debt'
import { fmtShort } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function SimulatorTab() {
  const { active } = useDebt()
  const { kpis } = useAnalytics()
  const { currency, money } = useMoney()

  const [extra, setExtra] = useState(0)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const included = useMemo(
    () => active.filter((d) => !excluded.has(d.id)),
    [active, excluded],
  )

  const result = useMemo(() => compareExtra(included, extra), [included, extra])
  const plan = useMemo(() => simulatePayoff(included, extra), [included, extra])

  const scenarios = [
    { label: '+$1.000.000', value: 1_000_000 },
    { label: '+20% ingresos', value: Math.round(kpis.monthIncome * 0.2) },
    { label: '-10% gastos', value: Math.round(kpis.monthExpense * 0.1) },
    { label: 'Sin extra', value: 0 },
  ]

  if (active.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Zap size={22} />} title="Agrega deudas para simular" description="El simulador proyecta cuándo saldrás de deudas según cuánto abones." />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Simulador de pago extra" subtitle="¿Cuánto adicional puedes abonar este mes?" icon={<Zap size={18} className="text-primary" />} />
        <AmountInput value={extra} onChange={setExtra} currency={currency} />
        <div className="mt-3 flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.label}
              onClick={() => setExtra(Math.max(0, s.value))}
              className={cn(
                'chip border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-content transition hover:bg-surface-3',
                extra === s.value && 'border-primary/60 bg-primary/10 text-primary',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Results */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted">
            <CalendarClock size={15} />
            <span className="text-xs">Salida de deudas</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-content">
            {result.newMonths !== null ? `${result.newMonths} meses` : 'No alcanza'}
          </p>
          {plan.payoffDate && (
            <p className="text-xs text-primary">
              {fmtShort(plan.payoffDate.toISOString().slice(0, 10))} {plan.payoffDate.getFullYear()}
            </p>
          )}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted">
            <PiggyBank size={15} />
            <span className="text-xs">Intereses ahorrados</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-income">
            {money(result.interestSaved, { compact: true })}
          </p>
          <p className="text-xs text-muted">vs. pagar solo mínimos</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted">
            <TrendingDown size={15} />
            <span className="text-xs">Meses que te ahorras</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            {result.monthsSaved !== null ? `${result.monthsSaved}` : '—'}
          </p>
          <p className="text-xs text-muted">más rápido</p>
        </div>
      </div>

      {extra > 0 && result.interestSaved > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-income/25 bg-income/[0.07] p-4 text-sm text-income">
          <Sparkles size={18} className="mt-0.5 shrink-0" />
          <p className="text-content">
            Si abonas <b>{money(extra)}</b> extra al mes, ahorrarás aproximadamente{' '}
            <b className="text-income">{money(result.interestSaved)}</b> en intereses
            {result.monthsSaved ? ` y saldrás ${result.monthsSaved} meses antes` : ''}. 🚀
          </p>
        </div>
      )}

      {/* Projection chart */}
      {plan.schedule.length > 1 && (
        <Card>
          <CardHeader title="Evolución proyectada de la deuda" subtitle="Con el plan simulado" />
          <LineTrend data={plan.schedule} dataKey="balance" xKey="label" color="rgb(var(--c-expense))" />
        </Card>
      )}

      {/* Scenario: exclude debts */}
      {active.length > 1 && (
        <Card>
          <CardHeader title="Escenario: ¿y si dejo de atacar una deuda?" subtitle="Desmarca para excluirla del plan" />
          <div className="space-y-2">
            {active.map((d) => (
              <label key={d.id} className="flex items-center justify-between rounded-xl bg-surface-2/50 p-3">
                <div>
                  <p className="text-sm font-medium text-content">{d.name}</p>
                  <p className="text-xs text-muted">{money(d.balance, { compact: true })}{d.interest_rate ? ` · ${d.interest_rate}%` : ' · sin interés'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!excluded.has(d.id)}
                  onChange={(e) => {
                    setExcluded((prev) => {
                      const next = new Set(prev)
                      if (e.target.checked) next.delete(d.id)
                      else next.add(d.id)
                      return next
                    })
                  }}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
