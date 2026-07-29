import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Bell,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Share2,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/EmptyState'
import { InsightCard, INSIGHT_ICONS } from '@/components/InsightCard'
import { ExportButtons } from '@/components/ExportButtons'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { IncomeExpenseBars } from '@/components/charts/IncomeExpenseBars'
import { CategoryPie } from '@/components/charts/CategoryPie'
import { CategoryRanking } from '@/components/charts/CategoryRanking'
import { LineTrend } from '@/components/charts/LineTrend'
import { FlowChart } from '@/components/charts/FlowChart'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import {
  monthlySeries,
  weeklySeries,
  annualSeries,
  dailySeries,
  expensesByCategory,
  type DateRange,
} from '@/lib/analytics'
import {
  generateInsights,
  generateAlerts,
  generateRecommendations,
} from '@/lib/insights'
import { startOfMonth, endOfMonth, subMonths, startOfYear, fmtMonthYear } from '@/lib/dates'
import { cn } from '@/lib/utils'

type RangeKey = 'month' | '3m' | '6m' | 'year' | 'all'
type FlowKey = 'daily' | 'weekly' | 'monthly' | 'annual'

function rangeFor(sel: RangeKey): DateRange {
  const now = new Date()
  switch (sel) {
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case '3m':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case '6m':
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case 'year':
      return { start: startOfYear(now), end: endOfMonth(now) }
    case 'all':
      return { start: new Date(2000, 0, 1), end: now }
  }
}

export function Analytics() {
  const { incomes, expenses, categories, debtPayments, opening, kpis, movements } = useAnalytics()
  const { money } = useMoney()
  const { t } = useI18n()
  const [range, setRange] = useState<RangeKey>('month')
  const [flow, setFlow] = useState<FlowKey>('daily')

  const dateRange = rangeFor(range)
  const byCat = useMemo(
    () => expensesByCategory(expenses, categories, dateRange, debtPayments),
    [expenses, categories, range, debtPayments],
  )
  const months12 = useMemo(
    () => monthlySeries(incomes, expenses, 12, new Date(), debtPayments),
    [incomes, expenses, debtPayments],
  )
  const weekly = useMemo(
    () => weeklySeries(incomes, expenses, 12, new Date(), debtPayments),
    [incomes, expenses, debtPayments],
  )
  const annual = useMemo(
    () => annualSeries(incomes, expenses, debtPayments),
    [incomes, expenses, debtPayments],
  )
  const daily = useMemo(
    () =>
      dailySeries(
        incomes,
        expenses,
        { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
        debtPayments,
      ),
    [incomes, expenses, debtPayments],
  )

  const insights = useMemo(
    () => generateInsights(incomes, expenses, categories, opening),
    [incomes, expenses, categories, opening],
  )
  const alerts = useMemo(
    () => generateAlerts(expenses, categories),
    [expenses, categories],
  )
  const recs = useMemo(
    () => generateRecommendations(incomes, expenses, categories, opening),
    [incomes, expenses, categories, opening],
  )

  const totalRange = byCat.reduce((a, s) => a + s.value, 0)

  const flowConfig = {
    daily: { data: daily, xKey: 'label', valueKey: 'net' },
    weekly: { data: weekly, xKey: 'label', valueKey: 'net' },
    monthly: { data: months12, xKey: 'label', valueKey: 'balance' },
    annual: { data: annual, xKey: 'year', valueKey: 'balance' },
  }[flow]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Análisis')}
        subtitle={t('Entiende tus hábitos y toma mejores decisiones')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/reporte" className="btn-outline">
              <Share2 size={16} /> {t('Reporte')}
            </Link>
            <ExportButtons
              movements={movements}
              kpis={kpis}
              periodLabel={`${t('Resumen')} · ${fmtMonthYear(new Date())}`}
            />
          </div>
        }
      />

      {/* Insights */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Lightbulb size={18} className="text-primary" /> {t('Información clave')}
        </h2>
        {insights.length === 0 ? (
          <Card>
            <EmptyState title={t('Sin datos suficientes')} description={t('Registra movimientos para generar análisis.')} />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} delay={i * 0.03} />
            ))}
          </div>
        )}
      </section>

      {/* Alerts */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Bell size={18} className="text-warning" /> {t('Alertas de gasto')}
        </h2>
        <Card>
          {alerts.length === 0 ? (
            <EmptyState
              icon={<Bell size={22} />}
              title={t('Todo en orden')}
              description={t('No hay variaciones significativas entre este mes y el anterior.')}
            />
          ) : (
            <div className="space-y-2.5">
              {alerts.map((a) => {
                const up = a.changePct > 0
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3"
                  >
                    <CategoryIcon icon={a.icon} color={a.color} size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content">{a.message}</p>
                      <p className="text-xs text-muted">
                        {money(a.previous)} → {money(a.current)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'chip shrink-0 text-xs font-semibold',
                        a.tone === 'positive' ? 'bg-income/12 text-income' : 'bg-expense/12 text-expense',
                      )}
                    >
                      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {Math.abs(a.changePct).toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </section>

      {/* Recommendations */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles size={18} className="text-info" /> {t('Recomendaciones de ahorro')}
        </h2>
        {recs.length === 0 ? (
          <Card>
            <EmptyState title={t('Sin recomendaciones')} description={t('Cuando tengas más historial, aquí verás sugerencias personalizadas.')} />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recs.map((r, i) => {
              const Icon = INSIGHT_ICONS[r.icon] ?? Sparkles
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/[0.06] p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info/15 text-info">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-content">{r.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted">{r.detail}</p>
                    {r.potentialSaving !== undefined && r.potentialSaving > 0 && (
                      <p className="mt-1.5 text-xs font-semibold text-income">
                        {t('Ahorro potencial:')} {money(r.potentialSaving, { compact: true })}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Distribution + ranking */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{t('Distribución de gastos')}</h2>
          <Segmented
            value={range}
            onChange={setRange}
            size="sm"
            options={[
              { value: 'month', label: t('Mes') },
              { value: '3m', label: t('3M') },
              { value: '6m', label: t('6M') },
              { value: 'year', label: t('Año') },
              { value: 'all', label: t('Todo') },
            ]}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={t('Por categoría')} subtitle={t('Distribución circular')} />
            <CategoryPie data={byCat} />
          </Card>
          <Card>
            <CardHeader title={t('Ranking de categorías')} subtitle={t('Mayor a menor gasto')} />
            <CategoryRanking data={byCat} limit={10} />
          </Card>
        </div>

        {/* Percent distribution bar */}
        {totalRange > 0 && (
          <Card>
            <CardHeader title={t('Distribución porcentual')} subtitle={t('Participación de cada categoría')} />
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {byCat.map((s) => (
                <div
                  key={s.id}
                  style={{ width: `${s.pct}%`, background: s.color }}
                  title={`${s.name}: ${s.pct.toFixed(1)}%`}
                  className="h-full transition-all hover:opacity-80"
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {byCat.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted">{s.name}</span>
                  <span className="tnum font-semibold text-content">{s.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Evolution lines */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t('Evolución de ingresos')}
            subtitle={t('Últimos 12 meses')}
            icon={<TrendingUp size={18} className="text-income" />}
          />
          <LineTrend data={months12} dataKey="income" xKey="label" color="rgb(var(--c-income))" />
        </Card>
        <Card>
          <CardHeader
            title={t('Evolución de gastos')}
            subtitle={t('Últimos 12 meses')}
            icon={<TrendingDown size={18} className="text-expense" />}
          />
          <LineTrend data={months12} dataKey="expense" xKey="label" color="rgb(var(--c-expense))" />
        </Card>
      </section>

      {/* Flow + comparison */}
      <section className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title={t('Flujo de caja')}
              subtitle={t('Movimiento neto por periodo')}
              action={
                <Segmented
                  value={flow}
                  onChange={setFlow}
                  size="sm"
                  options={[
                    { value: 'daily', label: t('Diario') },
                    { value: 'weekly', label: t('Semanal') },
                    { value: 'monthly', label: t('Mensual') },
                    { value: 'annual', label: t('Anual') },
                  ]}
                />
              }
            />
            <FlowChart
              data={flowConfig.data}
              xKey={flowConfig.xKey}
              valueKey={flowConfig.valueKey}
            />
          </Card>
          <Card>
            <CardHeader title={t('Comparación anual')} subtitle={t('Ingresos vs gastos por año')} />
            {annual.length === 0 ? (
              <EmptyState title={t('Sin datos anuales')} />
            ) : (
              <div className="space-y-4 pt-2">
                {annual.map((y) => (
                  <div key={y.year}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-content">{y.year}</span>
                      <span
                        className={cn(
                          'tnum text-xs font-semibold',
                          y.balance >= 0 ? 'text-income' : 'text-expense',
                        )}
                      >
                        {money(y.balance, { sign: true, compact: true })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="h-2 rounded-full bg-income"
                        style={{ width: `${(y.income / (y.income + y.expense || 1)) * 100}%` }}
                      />
                      <div
                        className="h-2 rounded-full bg-expense"
                        style={{ width: `${(y.expense / (y.income + y.expense || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title={t('Ingresos vs Gastos')} subtitle={t('Comparativo mensual · 12 meses')} />
          <IncomeExpenseBars data={months12} height={300} />
        </Card>
      </section>
    </div>
  )
}
