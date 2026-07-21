import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Landmark,
  Flame,
  Wallet,
  PiggyBank,
  Percent,
  CalendarClock,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingDown,
  Rocket,
  Plus,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { KpiCard } from '@/components/KpiCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { DebtCard } from './DebtCard'
import { DailyTargetCard } from './DailyTargetCard'
import { DebtProjectionChart } from './DebtProjectionChart'
import { CategoryPie } from '@/components/charts/CategoryPie'
import { useDebt } from '@/hooks/useDebt'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'
import { useDebtModal } from './modalContext'
import { hoursToPay } from '@/lib/debt'
import { fmtShort, daysInCurrentMonth } from '@/lib/dates'
import { debtTypeMeta } from '@/types'
import { cn } from '@/lib/utils'

const ALERT_ICONS = { AlertTriangle, Info, Flame, TrendingDown, CheckCircle2 }
const ALERT_STYLES = {
  negative: 'border-expense/25 bg-expense/[0.07] text-expense',
  warning: 'border-warning/25 bg-warning/[0.07] text-warning',
  info: 'border-info/25 bg-info/[0.07] text-info',
  positive: 'border-income/25 bg-income/[0.07] text-income',
}

const URGENCY = {
  red: 'text-expense bg-expense/12',
  yellow: 'text-warning bg-warning/12',
  green: 'text-income bg-income/12',
}

export function PlanOverview() {
  const { summary, avalanche, recommendation, alerts, calendar, basePlan, uber, phrases, allocation, projection } = useDebt()
  const { kpis } = useAnalytics()
  const { money } = useMoney()
  const open = useDebtModal()

  const colorMap = useMemo(
    () => new Map(projection.order.map((o) => [o.id, o.color])),
    [projection],
  )
  const allocSlices = useMemo(
    () =>
      allocation.items
        .filter((it) => it.total > 0)
        .map((it) => ({
          id: it.debt.id,
          name: it.debt.name,
          color: colorMap.get(it.debt.id) ?? '#94a3b8',
          icon: debtTypeMeta(it.debt.type).icon,
          value: it.total,
          count: 1,
          pct: it.pct,
        })),
    [allocation, colorMap],
  )

  // surplus = income - expense this month
  const surplus = kpis.monthIncome - kpis.monthExpense

  const grouped = useMemo(() => {
    const hoy = calendar.filter((c) => c.daysUntil <= 0)
    const semana = calendar.filter((c) => c.daysUntil > 0 && c.daysUntil <= 7)
    const mes = calendar.filter((c) => c.daysUntil > 7 && c.daysUntil <= 31)
    return { hoy, semana, mes }
  }, [calendar])

  if (summary.activeCount === 0 && summary.paidCount === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Target size={24} />}
          title="Empieza tu plan de libertad financiera"
          description="Agrega tus deudas y te diré cuál atacar primero, cuánto ahorrarás en intereses y cuándo quedarás libre."
          action={
            <button onClick={() => open({ type: 'debt' })} className="btn-primary mt-1">
              <Plus size={16} /> Agregar mi primera deuda
            </button>
          }
        />
      </Card>
    )
  }

  if (summary.activeCount === 0) {
    return (
      <Card className="text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-income/15 text-income">
          <Rocket size={30} />
        </div>
        <h2 className="font-display text-2xl font-bold">¡Eres libre de deudas! 🎉</h2>
        <p className="mt-2 text-muted">
          Pagaste todas tus deudas. Ahora ese dinero puede ir a ahorro e inversión.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Giant progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-bg-soft p-5 sm:p-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted">
            <Target size={16} />
            <span className="text-sm font-medium">Progreso hacia la libertad</span>
          </div>
          <span className="tnum font-display text-2xl font-bold text-primary">
            {summary.pctPaid.toFixed(0)}%
          </span>
        </div>

        <div className="relative h-7 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, summary.pctPaid)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full rounded-full bg-gradient-to-r from-income via-primary to-income"
            style={{ backgroundSize: '200% 100%' }}
          >
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </motion.div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted">
            Pagado: <b className="text-income">{money(summary.paidTotal)}</b>
          </span>
          <span className="font-semibold text-content">
            Faltan {money(summary.totalDebt)}
          </span>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Deuda total" value={summary.totalDebt} icon={Landmark} tone="expense" />
        <KpiCard label="Con interés" value={summary.withInterest} icon={Flame} tone="expense" />
        <KpiCard label="Sin interés" value={summary.withoutInterest} icon={Wallet} tone="info" />
        <KpiCard
          label="Interés mensual estimado"
          value={summary.monthlyInterest}
          icon={Percent}
          tone="expense"
          sub="lo que crece tu deuda/mes"
        />
        <KpiCard label="Pagado este año" value={summary.paidThisYear} icon={PiggyBank} tone="income" />
        <KpiCard label="Pagado en total" value={summary.paidTotal} icon={CheckCircle2} tone="income" />
        <KpiCard label="Dinero pendiente" value={summary.totalDebt} icon={CalendarClock} tone="primary" />
        <div className="card card-hover flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted">Porcentaje pagado</p>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Percent size={18} />
            </span>
          </div>
          <p className="tnum mt-2 font-display text-2xl font-bold text-primary">
            {summary.pctPaid.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation.debt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-primary/[0.08] p-5"
        >
          <div className="flex items-center gap-2 text-primary">
            <Target size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">Ataca esta deuda este mes</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-content">{recommendation.debt.name}</p>
              <p className="mt-1 max-w-lg text-sm text-muted">{recommendation.reason}</p>
            </div>
            <div className="text-right">
              <p className="tnum font-display text-2xl font-bold text-expense">
                {money(recommendation.debt.balance)}
              </p>
              {uber.netPerHour > 0 && (
                <p className="text-xs text-muted">
                  ≈ {Math.ceil(hoursToPay(recommendation.debt.balance, uber.netPerHour))} horas de trabajo
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => open({ type: 'payment', debtId: recommendation.debt!.id })}
            className="btn-primary mt-4"
          >
            Registrar pago <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {/* Daily income target */}
      <DailyTargetCard />

      {/* Payoff projection + surplus */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Proyección" subtitle="Con tu ritmo de pagos actual" icon={<Rocket size={18} className="text-primary" />} />
          {basePlan.months !== null ? (
            <div>
              <p className="text-sm text-muted">Quedarás libre de deudas en</p>
              <p className="font-display text-3xl font-bold text-content">
                {basePlan.months} {basePlan.months === 1 ? 'mes' : 'meses'}
              </p>
              {basePlan.payoffDate && (
                <p className="mt-1 text-sm text-primary">
                  Fecha estimada: {fmtShort(basePlan.payoffDate.toISOString().slice(0, 10))}{' '}
                  {basePlan.payoffDate.getFullYear()}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">
                Interés total proyectado: {money(basePlan.totalInterest)}. Usa el simulador para acelerarlo.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-warning">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">
                Con los pagos mínimos actuales tus deudas casi no bajan. Sube tus pagos objetivo o usa el
                simulador para ver cuánto necesitas abonar.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Dinero disponible este mes" icon={<PiggyBank size={18} className="text-income" />} />
          {surplus > 0 ? (
            <div>
              <p className="text-sm text-muted">Te ha sobrado (ingresos − gastos)</p>
              <p className="tnum font-display text-3xl font-bold text-income">{money(surplus)}</p>
              {recommendation.debt && (
                <>
                  <p className="mt-3 text-sm text-content">
                    💡 Considera un abono extraordinario a <b>{recommendation.debt.name}</b>.
                  </p>
                  <button
                    onClick={() => open({ type: 'payment', debtId: recommendation.debt!.id })}
                    className="btn bg-income/12 mt-3 text-income hover:bg-income/20"
                  >
                    Abonar {money(surplus, { compact: true })}
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted">
              Este mes tus gastos igualan o superan tus ingresos. Cuida el flujo antes de abonos extra.
            </p>
          )}
        </Card>
      </div>

      {/* Avalanche order */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Orden de ataque (Avalancha)</h2>
          <span className="chip bg-surface-2 text-[10px] text-muted">mayor interés primero</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {avalanche.map((d, i) => (
            <DebtCard
              key={d.id}
              debt={d}
              rank={i + 1}
              onEdit={() => open({ type: 'debt', editing: d })}
              onPay={() => open({ type: 'payment', debtId: d.id })}
            />
          ))}
        </div>
      </div>

      {/* Distribution + per-debt projection */}
      {allocSlices.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Cómo se reparte tu dinero"
              subtitle={`Presupuesto mensual ${money(allocation.budget)} · ≈ ${money(
                allocation.budget / daysInCurrentMonth(),
                { compact: true },
              )}/día`}
            />
            <CategoryPie data={allocSlices} />
            <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
              {allocation.items.map((it) => (
                <div key={it.debt.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: colorMap.get(it.debt.id) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-content">{it.debt.name}</span>
                  <span className="tnum font-semibold text-content">
                    {money(it.total, { compact: true })}
                  </span>
                  <span className="tnum w-10 text-right text-xs text-muted">
                    {it.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Proyección por deuda"
              subtitle="Cómo se van pagando (pagos mínimos)"
            />
            {projection.series.length > 1 ? (
              <>
                <DebtProjectionChart projection={projection} />
                {projection.payoff.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                    {projection.payoff.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 size={14} style={{ color: p.color }} />
                        <span className="flex-1 truncate text-content">{p.name}</span>
                        <span className="text-xs text-muted">
                          {fmtShort(p.date.toISOString().slice(0, 10))} {p.date.getFullYear()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-center text-xs text-subtle">
                  Ajusta un pago extra y mira el impacto en la pestaña <b>Simulador</b>.
                </p>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted">
                Agrega el pago mínimo a tus deudas para ver la proyección.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Next payments */}
      <Card>
        <CardHeader title="Próximos pagos y fechas" icon={<CalendarClock size={18} className="text-warning" />} />
        {calendar.length === 0 ? (
          <p className="py-3 text-sm text-muted">
            Agrega días de corte/pago a tus deudas para ver aquí tus próximos vencimientos.
          </p>
        ) : (
          <div className="space-y-4">
            {([['Hoy', grouped.hoy], ['Esta semana', grouped.semana], ['Este mes', grouped.mes]] as const).map(
              ([label, items]) =>
                items.length > 0 && (
                  <div key={label}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">{label}</p>
                    <div className="space-y-1.5">
                      {items.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 p-2.5">
                          <span className={cn('grid h-8 w-8 place-items-center rounded-lg text-xs font-bold', URGENCY[c.urgency])}>
                            {c.date.getDate()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-content">{c.title}</p>
                            <p className="text-xs text-muted">
                              {fmtShort(c.date.toISOString().slice(0, 10))}
                              {c.daysUntil > 0 && ` · en ${c.daysUntil}d`}
                              {c.daysUntil <= 0 && ' · hoy'}
                            </p>
                          </div>
                          {c.amount && (
                            <span className="tnum text-sm font-semibold text-content">
                              {money(c.amount, { compact: true })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
        )}
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">Alertas inteligentes</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {alerts.map((a) => {
              const Icon = ALERT_ICONS[a.icon as keyof typeof ALERT_ICONS] ?? Info
              return (
                <div key={a.id} className={cn('flex items-start gap-3 rounded-2xl border p-3.5', ALERT_STYLES[a.tone])}>
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-content">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{a.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motivation */}
      {phrases.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent p-5">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="text-sm font-semibold">Motivación</span>
          </div>
          <div className="space-y-2">
            {phrases.map((p, i) => (
              <p key={i} className="text-sm text-content">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
