import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  Plus,
  Coins,
} from 'lucide-react'
import { KpiCard } from '@/components/KpiCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { MovementRow } from '@/components/MovementRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { IncomeExpenseBars } from '@/components/charts/IncomeExpenseBars'
import { CategoryPie } from '@/components/charts/CategoryPie'
import { FlowChart } from '@/components/charts/FlowChart'
import { CategoryRanking } from '@/components/charts/CategoryRanking'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'
import { useUI } from '@/store/ui'
import {
  monthlySeries,
  dailySeries,
  expensesByCategory,
} from '@/lib/analytics'
import { pendingDebtThisMonth } from '@/lib/debt'
import { startOfMonth, endOfMonth, fmtLong } from '@/lib/dates'
import { cn } from '@/lib/utils'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function Dashboard() {
  const { incomes, expenses, categories, debtPayments, debts, profile, kpis, movements } =
    useAnalytics()
  const { money } = useMoney()
  const openExpense = useUI((s) => s.openExpense)
  const openIncome = useUI((s) => s.openIncome)
  const openTip = useUI((s) => s.openTip)

  const months = useMemo(
    () => monthlySeries(incomes, expenses, 6, new Date(), debtPayments),
    [incomes, expenses, debtPayments],
  )
  const monthRange = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }
  const daily = useMemo(
    () => dailySeries(incomes, expenses, monthRange, debtPayments),
    [incomes, expenses, debtPayments],
  )
  const byCat = useMemo(
    () => expensesByCategory(expenses, categories, monthRange, debtPayments),
    [expenses, categories, debtPayments],
  )
  const recent = movements.slice(0, 6)
  const pendingDebt = useMemo(
    () => pendingDebtThisMonth(debts, debtPayments),
    [debts, debtPayments],
  )

  const incomeSpark = months.map((m) => m.income)
  const expenseSpark = months.map((m) => m.expense)
  const balanceSpark = months.map((m) => m.balance)
  const cumulativeSpark = daily.map((d) => d.cumulative)

  const TrendIcon =
    kpis.trend === 'up' ? ArrowUpRight : kpis.trend === 'down' ? ArrowDownRight : Minus

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {profile?.display_name || 'de nuevo'} 👋
          </h1>
          <p className="mt-1 text-xs capitalize text-subtle">{fmtLong(new Date())}</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => openIncome()} className="btn bg-income/12 text-income hover:bg-income/20">
            <TrendingUp size={16} /> Ingreso
          </button>
          <button onClick={() => openExpense()} className="btn bg-expense/12 text-expense hover:bg-expense/20">
            <TrendingDown size={16} /> Gasto
          </button>
        </div>
      </div>

      {/* Hero balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-bg-soft p-5 sm:p-6"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'rgb(var(--c-primary))' }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted">
              <Wallet size={16} />
              <span className="text-sm">Dinero disponible</span>
            </div>
            <AnimatedNumber
              value={kpis.available}
              currency={profile?.currency ?? 'COP'}
              className="tnum mt-1 block font-display text-4xl font-bold tracking-tight sm:text-5xl"
            />
            {debts.length > 0 && (
              <p className="mt-1.5 text-xs text-muted">
                {pendingDebt > 0 ? (
                  <>
                    Te falta pagar{' '}
                    <b className="tnum text-expense">{money(pendingDebt)}</b> de deudas este mes
                  </>
                ) : (
                  <span className="text-income">✓ Deudas del mes al día</span>
                )}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'chip text-xs font-semibold',
                  kpis.monthBalance >= 0 ? 'bg-income/12 text-income' : 'bg-expense/12 text-expense',
                )}
              >
                <Scale size={13} />
                Balance mes: {money(kpis.monthBalance, { sign: true, compact: true })}
              </span>
              <span className="chip bg-surface-2 text-xs text-muted">
                <PiggyBank size={13} /> Ahorro: {money(kpis.totalSavings, { compact: true })}
              </span>
              <button
                onClick={() => openTip()}
                className="chip bg-[#14b8a6]/12 text-xs font-semibold text-[#14b8a6] transition hover:bg-[#14b8a6]/20"
              >
                <Coins size={13} /> Propinas mes: {money(kpis.monthTips, { compact: true })}
              </button>
            </div>
          </div>
          <div className="flex gap-2 sm:hidden">
            <button onClick={() => openIncome()} className="grid h-11 w-11 place-items-center rounded-xl bg-income/15 text-income">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Ingresos de hoy" value={kpis.todayIncome} icon={TrendingUp} tone="income" delay={0.02} />
        <KpiCard label="Gastos de hoy" value={kpis.todayExpense} icon={TrendingDown} tone="expense" delay={0.04} />
        <KpiCard
          label="Ingresos del mes"
          value={kpis.monthIncome}
          icon={TrendingUp}
          tone="income"
          spark={incomeSpark}
          delay={0.06}
        />
        <KpiCard
          label="Gastos del mes"
          value={kpis.monthExpense}
          icon={TrendingDown}
          tone="expense"
          delta={kpis.expenseChangePct}
          deltaInvert
          spark={expenseSpark}
          delay={0.08}
        />
        <KpiCard
          label="Balance del mes"
          value={kpis.monthBalance}
          icon={Scale}
          tone={kpis.monthBalance >= 0 ? 'income' : 'expense'}
          sign
          delta={kpis.balanceChangePct}
          spark={balanceSpark}
          delay={0.1}
        />
        <KpiCard
          label="Ahorro acumulado"
          value={kpis.totalSavings}
          icon={PiggyBank}
          tone="primary"
          spark={cumulativeSpark}
          delay={0.12}
        />
        <KpiCard
          label="Promedio diario"
          value={kpis.dailyAvgExpense}
          icon={CalendarDays}
          tone="info"
          sub="gasto/día este mes"
          delay={0.14}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="card card-hover flex flex-col justify-between p-4 sm:p-5"
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted">Tendencia financiera</p>
            <span
              className={cn(
                'grid h-10 w-10 place-items-center rounded-xl ring-1',
                kpis.trend === 'up' && 'bg-income/10 text-income ring-income/20',
                kpis.trend === 'down' && 'bg-expense/10 text-expense ring-expense/20',
                kpis.trend === 'flat' && 'bg-surface-2 text-muted ring-border',
              )}
            >
              <TrendIcon size={18} />
            </span>
          </div>
          <div className="mt-2">
            <p
              className={cn(
                'font-display text-lg font-bold',
                kpis.trend === 'up' && 'text-income',
                kpis.trend === 'down' && 'text-expense',
                kpis.trend === 'flat' && 'text-content',
              )}
            >
              {kpis.trend === 'up' ? 'Mejorando' : kpis.trend === 'down' ? 'A la baja' : 'Estable'}
            </p>
            <p className="text-[11px] text-subtle">
              {kpis.savingsRate >= 0
                ? `Tasa de ahorro ${kpis.savingsRate.toFixed(0)}%`
                : 'Gastos sobre ingresos'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" delay={0.05}>
          <CardHeader
            title="Ingresos vs Gastos"
            subtitle="Últimos 6 meses"
            action={
              <Link to="/analisis" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Ver más <ChevronRight size={14} />
              </Link>
            }
          />
          <IncomeExpenseBars data={months} />
        </Card>

        <Card delay={0.08}>
          <CardHeader title="Gastos por categoría" subtitle="Este mes" />
          <CategoryPie data={byCat} />
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" delay={0.05}>
          <CardHeader title="Flujo de caja diario" subtitle="Movimiento neto del mes en curso" />
          <FlowChart data={daily} xKey="label" valueKey="net" />
        </Card>

        <Card delay={0.08}>
          <CardHeader title="Ranking de gastos" subtitle="Categorías del mes" />
          <CategoryRanking data={byCat} limit={6} />
        </Card>
      </div>

      {/* Recent movements */}
      <Card delay={0.05}>
        <CardHeader
          title="Movimientos recientes"
          action={
            <Link to="/historial" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Ver todo <ChevronRight size={14} />
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Sin movimientos aún"
            description="Registra tu primer ingreso o gasto para empezar."
            action={
              <button onClick={() => openIncome()} className="btn-primary mt-1">
                <Plus size={16} /> Agregar movimiento
              </button>
            }
          />
        ) : (
          <div className="space-y-0.5">
            {recent.map((m) => (
              <MovementRow key={`${m.kind}-${m.id}`} m={m} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
