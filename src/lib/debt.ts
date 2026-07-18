import { addMonths, differenceInCalendarDays, endOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  Debt,
  DebtGoal,
  DebtPayment,
  FixedExpense,
  Reminder,
  WorkSession,
  ReminderCategory,
} from '@/types'
import { debtTypeMeta } from '@/types'
import { CATEGORY_COLORS } from './icons'
import { safeDiv } from './utils'

const monthlyRate = (d: Debt) => (d.interest_rate ?? 0) / 100 / 12
export const hasInterest = (d: Debt) => (d.interest_rate ?? 0) > 0

/* ------------------------------------------------ Avalanche order */

/** Avalanche: highest interest first; ties → smallest balance first.
 *  Debts without interest always go last. */
export function sortAvalanche(debts: Debt[]): Debt[] {
  return [...debts]
    .filter((d) => d.status === 'active' && d.balance > 0)
    .sort((a, b) => {
      const ra = a.interest_rate ?? 0
      const rb = b.interest_rate ?? 0
      if (rb !== ra) return rb - ra
      return a.balance - b.balance
    })
}

export interface Recommendation {
  debt: Debt | null
  reason: string
}

export function nextRecommendedDebt(debts: Debt[]): Recommendation {
  const ordered = sortAvalanche(debts)
  if (ordered.length === 0) return { debt: null, reason: '' }
  const top = ordered[0]
  if (hasInterest(top)) {
    return {
      debt: top,
      reason: `Tiene la tasa de interés más alta (${top.interest_rate}% anual). Atacarla primero es lo que menos te cuesta.`,
    }
  }
  return {
    debt: top,
    reason: 'No hay deudas con interés pendientes. Ataca la de menor saldo para ganar impulso.',
  }
}

/* ------------------------------------------------------- Summary */

export interface DebtSummary {
  totalDebt: number
  withInterest: number
  withoutInterest: number
  monthlyInterest: number
  initialTotal: number
  paidTotal: number
  paidThisYear: number
  pctPaid: number
  activeCount: number
  paidCount: number
  minPaymentsTotal: number
}

export function debtSummary(debts: Debt[], payments: DebtPayment[]): DebtSummary {
  const active = debts.filter((d) => d.status === 'active')
  const totalDebt = active.reduce((a, d) => a + d.balance, 0)
  const withInterest = active.filter(hasInterest).reduce((a, d) => a + d.balance, 0)
  const withoutInterest = totalDebt - withInterest
  const monthlyInterest = active.reduce((a, d) => a + d.balance * monthlyRate(d), 0)
  const initialTotal = debts.reduce((a, d) => a + d.initial_balance, 0)
  const currentTotal = debts.reduce((a, d) => a + d.balance, 0)
  const paidTotal = Math.max(0, initialTotal - currentTotal)
  const year = new Date().getFullYear().toString()
  const paidThisYear = payments
    .filter((p) => p.date.slice(0, 4) === year)
    .reduce((a, p) => a + p.amount, 0)

  return {
    totalDebt,
    withInterest,
    withoutInterest,
    monthlyInterest,
    initialTotal,
    paidTotal,
    paidThisYear,
    pctPaid: safeDiv(paidTotal, initialTotal) * 100,
    activeCount: active.length,
    paidCount: debts.filter((d) => d.status === 'paid').length,
    minPaymentsTotal: active.reduce((a, d) => a + d.min_payment, 0),
  }
}

/* -------------------------------------------- Payoff simulation */

export interface PayoffResult {
  months: number | null // null = no termina con el presupuesto actual
  payoffDate: Date | null
  totalInterest: number
  perDebt: Record<string, { months: number; date: Date }>
  schedule: { month: number; label: string; balance: number; interest: number; principal: number }[]
}

/**
 * Month-by-month avalanche simulation with rollover.
 * `extraMonthly` is added on top of the sum of minimum payments.
 */
export function simulatePayoff(debts: Debt[], extraMonthly = 0, ref = new Date()): PayoffResult {
  const sim = debts
    .filter((d) => d.status === 'active' && d.balance > 0)
    .map((d) => ({ id: d.id, balance: d.balance, rate: monthlyRate(d), min: d.min_payment }))

  const budget = sim.reduce((a, d) => a + d.min, 0) + extraMonthly
  const perDebt: PayoffResult['perDebt'] = {}
  const schedule: PayoffResult['schedule'] = []
  let totalInterest = 0
  const MAX = 600

  if (sim.length === 0) {
    return { months: 0, payoffDate: ref, totalInterest: 0, perDebt, schedule }
  }

  let month = 0
  for (; month < MAX; month++) {
    const active = sim.filter((d) => d.balance > 0.5)
    if (active.length === 0) break

    // 1) accrue interest
    let monthInterest = 0
    for (const d of active) {
      const i = d.balance * d.rate
      d.balance += i
      monthInterest += i
      totalInterest += i
    }

    // 2) pay minimums (avalanche order for leftover)
    let remaining = budget
    const ordered = active.sort((a, b) => b.rate - a.rate || a.balance - b.balance)
    for (const d of ordered) {
      const pay = Math.min(d.min, d.balance, remaining)
      d.balance -= pay
      remaining -= pay
    }
    // 3) throw the rest at the top avalanche debt(s)
    for (const d of ordered) {
      if (remaining <= 0) break
      const pay = Math.min(d.balance, remaining)
      d.balance -= pay
      remaining -= pay
    }

    let monthBalance = 0
    for (const d of sim) {
      if (d.balance <= 0.5 && !perDebt[d.id]) {
        perDebt[d.id] = { months: month + 1, date: addMonths(ref, month + 1) }
        d.balance = 0
      }
      monthBalance += Math.max(0, d.balance)
    }

    schedule.push({
      month: month + 1,
      label: format(addMonths(ref, month + 1), 'MMM yy', { locale: es }),
      balance: Math.round(monthBalance),
      interest: Math.round(monthInterest),
      principal: Math.round(budget - monthInterest),
    })

    // negative amortization guard
    if (month > 3 && monthBalance >= schedule[schedule.length - 2].balance) {
      return { months: null, payoffDate: null, totalInterest, perDebt, schedule }
    }
  }

  const finished = sim.every((d) => d.balance <= 0.5)
  return {
    months: finished ? month : null,
    payoffDate: finished ? addMonths(ref, month) : null,
    totalInterest,
    perDebt,
    schedule,
  }
}

/* ----------------------------------------- Payment allocation */

export interface AllocationItem {
  debt: Debt
  base: number // minimum portion
  extra: number // avalanche extra
  total: number
  pct: number
}
export interface MonthlyAllocation {
  budget: number
  extra: number
  items: AllocationItem[]
}

/** How this month's payment budget (minimums + extra) splits across debts. */
export function monthlyAllocation(debts: Debt[], extra = 0): MonthlyAllocation {
  const ordered = sortAvalanche(debts)
  const budget = ordered.reduce((a, d) => a + d.min_payment, 0) + extra
  const items: AllocationItem[] = ordered.map((d) => ({
    debt: d,
    base: Math.min(d.min_payment, d.balance),
    extra: 0,
    total: 0,
    pct: 0,
  }))
  let remaining = extra
  for (const it of items) {
    if (remaining <= 0) break
    const room = Math.max(0, it.debt.balance - it.base)
    const pay = Math.min(room, remaining)
    it.extra += pay
    remaining -= pay
  }
  const used = items.reduce((a, it) => a + it.base + it.extra, 0)
  for (const it of items) {
    it.total = it.base + it.extra
    it.pct = used > 0 ? (it.total / used) * 100 : 0
  }
  return { budget, extra, items }
}

/* ----------------------------------------- Per-debt projection */

export interface DebtProjection {
  months: number | null
  payoffDate: Date | null
  order: { id: string; name: string; color: string }[]
  series: Record<string, number | string>[]
  payoff: { id: string; name: string; color: string; month: number; date: Date }[]
}

/** Balance of every debt month-by-month (for a stacked area chart). */
export function projectDebts(debts: Debt[], extra = 0, ref = new Date()): DebtProjection {
  const ordered = sortAvalanche(debts)
  const order = ordered.map((d, i) => ({
    id: d.id,
    name: d.name,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))
  const sim = ordered.map((d) => ({ id: d.id, balance: d.balance, rate: monthlyRate(d), min: d.min_payment }))
  const budget = sim.reduce((a, d) => a + d.min, 0) + extra
  const nameOf = new Map(order.map((o) => [o.id, o]))

  const point0: Record<string, number | string> = { label: 'Hoy' }
  for (const d of sim) point0[d.id] = Math.round(d.balance)
  const series = [point0]
  const payoff: DebtProjection['payoff'] = []
  const MAX = 120

  let month = 0
  for (; month < MAX; month++) {
    const activeSim = sim.filter((d) => d.balance > 0.5)
    if (activeSim.length === 0) break

    for (const d of activeSim) d.balance += d.balance * d.rate
    let remaining = budget
    const av = activeSim.sort((a, b) => b.rate - a.rate || a.balance - b.balance)
    for (const d of av) {
      const pay = Math.min(d.min, d.balance, remaining)
      d.balance -= pay
      remaining -= pay
    }
    for (const d of av) {
      if (remaining <= 0) break
      const pay = Math.min(d.balance, remaining)
      d.balance -= pay
      remaining -= pay
    }

    const pt: Record<string, number | string> = {
      label: format(addMonths(ref, month + 1), 'MMM yy', { locale: es }),
    }
    for (const d of sim) {
      if (d.balance <= 0.5 && d.balance !== -1) {
        d.balance = 0
        if (!payoff.find((p) => p.id === d.id)) {
          const o = nameOf.get(d.id)!
          payoff.push({ ...o, month: month + 1, date: addMonths(ref, month + 1) })
          d.balance = -1 // mark recorded, render as 0
        }
      }
      pt[d.id] = Math.round(Math.max(0, d.balance))
    }
    series.push(pt)
    if (sim.every((d) => d.balance <= 0)) {
      month++
      break
    }
  }

  const finished = sim.every((d) => d.balance <= 0)
  return {
    months: finished ? month : null,
    payoffDate: finished ? addMonths(ref, month) : null,
    order,
    series,
    payoff,
  }
}

export interface SavingsComparison {
  baseInterest: number
  baseMonths: number | null
  newInterest: number
  newMonths: number | null
  interestSaved: number
  monthsSaved: number | null
}

/** Compares "solo mínimos" vs "mínimos + extra". */
export function compareExtra(debts: Debt[], extraMonthly: number, ref = new Date()): SavingsComparison {
  const base = simulatePayoff(debts, 0, ref)
  const withExtra = simulatePayoff(debts, extraMonthly, ref)
  return {
    baseInterest: base.totalInterest,
    baseMonths: base.months,
    newInterest: withExtra.totalInterest,
    newMonths: withExtra.months,
    interestSaved: Math.max(0, base.totalInterest - withExtra.totalInterest),
    monthsSaved:
      base.months !== null && withExtra.months !== null ? base.months - withExtra.months : null,
  }
}

/* --------------------------------------------------- Uber math */

export interface UberStats {
  totalHours: number
  totalEarnings: number
  totalFuel: number
  netTotal: number
  netPerHour: number
  avgPerDay: number
  sessions: number
}

export function uberStats(sessions: WorkSession[]): UberStats {
  const totalHours = sessions.reduce((a, s) => a + s.hours, 0)
  const totalEarnings = sessions.reduce((a, s) => a + s.earnings, 0)
  const totalFuel = sessions.reduce((a, s) => a + s.fuel_cost, 0)
  const netTotal = totalEarnings - totalFuel
  const days = new Set(sessions.map((s) => s.date)).size
  return {
    totalHours,
    totalEarnings,
    totalFuel,
    netTotal,
    netPerHour: safeDiv(netTotal, totalHours),
    avgPerDay: safeDiv(netTotal, days),
    sessions: sessions.length,
  }
}

export function hoursToPay(balance: number, netPerHour: number): number {
  return netPerHour > 0 ? balance / netPerHour : 0
}

/**
 * Minimum debt payments still pending this month, across ALL active debts
 * (independent of the daily-goal checkbox).
 */
export function pendingDebtThisMonth(
  debts: Debt[],
  debtPayments: DebtPayment[],
  ref = new Date(),
): number {
  const monthKey = format(ref, 'yyyy-MM')
  const paid = new Map<string, number>()
  for (const p of debtPayments) {
    if (p.date.slice(0, 7) !== monthKey) continue
    paid.set(p.debt_id, (paid.get(p.debt_id) ?? 0) + p.amount)
  }
  return debts
    .filter((d) => d.status === 'active')
    .reduce((a, d) => a + Math.max(0, d.min_payment - (paid.get(d.id) ?? 0)), 0)
}

/* --------------------------------------------- Daily income target */

/** Fuel overhead: earn 30% extra so the payment stays "free" after gas. */
export const FUEL_FACTOR = 1.3

export interface DailyTargets {
  daysLeftInMonth: number
  fuelFactor: number
  hasCards: boolean
  hasDebts: boolean
  // Remaining obligation THIS cycle (net, after what's already paid)
  cardRemaining: number
  allRemaining: number
  targetRemaining: number
  cardMinimums: number
  allMinimums: number
  // Gross daily target = net-per-day × fuelFactor (per-debt due dates)
  cardPerDay: number
  allPerDay: number
  targetPerDay: number
  // Net portion (the actual payment) per day
  cardNetPerDay: number
  allNetPerDay: number
  // Days until the nearest payment due date (fallback: end of month)
  cardDaysToDue: number
  allDaysToDue: number
  cardHoursPerDay: number | null
  // Fixed monthly expenses (rent, utilities, subscriptions…)
  hasFixed: boolean
  fixedTotal: number
  fixedNetPerDay: number
  // "Cover everything": fixed expenses + all debt minimums
  totalNetPerDay: number
  totalPerDay: number
  totalHoursPerDay: number | null
  totalDaysToDue: number
  /** Same target ignoring what's already paid — used for the next cycle. */
  totalPerDayFull: number
}

/**
 * How much to EARN per day (gross, incl. fuel via `fuelFactor`) so the credit
 * card minimums — and optionally all minimums / target pace — stay covered.
 * Each debt is spread over the days until ITS OWN payment due date.
 */
export function dailyEarningTargets(
  debts: Debt[],
  debtPayments: DebtPayment[],
  netPerHour = 0,
  ref = new Date(),
  fixedExpenses: FixedExpense[] = [],
  fuelFactor = FUEL_FACTOR,
): DailyTargets {
  const active = debts.filter((d) => d.status === 'active')
  // Only debts marked to count toward the daily goal (default: yes).
  const counted = active.filter((d) => d.count_in_target !== false)
  const cards = counted.filter((d) => d.type === 'credit_card')
  const activeFixed = fixedExpenses.filter((f) => f.active && f.amount > 0)
  const monthKey = format(ref, 'yyyy-MM')
  const daysLeftInMonth = Math.max(1, endOfMonth(ref).getDate() - ref.getDate() + 1)

  const paidThisMonth = new Map<string, number>()
  for (const p of debtPayments) {
    if (p.date.slice(0, 7) !== monthKey) continue
    paidThisMonth.set(p.debt_id, (paidThisMonth.get(p.debt_id) ?? 0) + p.amount)
  }

  // Days until a due day's next occurrence (fallback: end of month).
  const daysToDueDay = (dueDay: number | null) =>
    dueDay
      ? Math.max(1, differenceInCalendarDays(nextMonthlyDate(dueDay, ref), ref))
      : daysLeftInMonth
  const daysToDue = (d: Debt) => daysToDueDay(d.due_day)

  const remainingOf = (d: Debt, pick: (d: Debt) => number) =>
    Math.max(0, pick(d) - (paidThisMonth.get(d.id) ?? 0))
  const netPerDayFor = (list: Debt[], pick: (d: Debt) => number) =>
    list.reduce((a, d) => a + remainingOf(d, pick) / daysToDue(d), 0)
  const remainingSum = (list: Debt[], pick: (d: Debt) => number) =>
    list.reduce((a, d) => a + remainingOf(d, pick), 0)
  const nearestDue = (list: Debt[]) => {
    const pending = list.filter((d) => remainingOf(d, (x) => x.min_payment) > 0)
    return pending.length ? Math.min(...pending.map(daysToDue)) : daysLeftInMonth
  }

  const cardNetPerDay = netPerDayFor(cards, (d) => d.min_payment)
  const allNetPerDay = netPerDayFor(counted, (d) => d.min_payment)
  const targetNetPerDay = netPerDayFor(counted, (d) => d.target_payment || d.min_payment)

  // Fixed expenses spread over their own due dates
  const fixedTotal = activeFixed.reduce((a, f) => a + f.amount, 0)
  const fixedNetPerDay = activeFixed.reduce((a, f) => a + f.amount / daysToDueDay(f.due_day), 0)

  const totalNetPerDay = allNetPerDay + fixedNetPerDay
  // Same figure ignoring payments already made (what a full cycle demands).
  const totalNetPerDayFull =
    counted.reduce((a, d) => a + d.min_payment / daysToDue(d), 0) + fixedNetPerDay
  const dueCandidates = [
    ...counted.filter((d) => remainingOf(d, (x) => x.min_payment) > 0).map(daysToDue),
    ...activeFixed.map((f) => daysToDueDay(f.due_day)),
  ]

  return {
    daysLeftInMonth,
    fuelFactor,
    hasCards: cards.length > 0,
    hasDebts: counted.length > 0,
    cardRemaining: remainingSum(cards, (d) => d.min_payment),
    allRemaining: remainingSum(counted, (d) => d.min_payment),
    targetRemaining: remainingSum(counted, (d) => d.target_payment || d.min_payment),
    cardMinimums: cards.reduce((a, d) => a + d.min_payment, 0),
    allMinimums: counted.reduce((a, d) => a + d.min_payment, 0),
    cardPerDay: cardNetPerDay * fuelFactor,
    allPerDay: allNetPerDay * fuelFactor,
    targetPerDay: targetNetPerDay * fuelFactor,
    cardNetPerDay,
    allNetPerDay,
    cardDaysToDue: nearestDue(cards),
    allDaysToDue: nearestDue(counted),
    cardHoursPerDay: netPerHour > 0 ? cardNetPerDay / netPerHour : null,
    hasFixed: activeFixed.length > 0,
    fixedTotal,
    fixedNetPerDay,
    totalNetPerDay,
    totalPerDay: totalNetPerDay * fuelFactor,
    totalHoursPerDay: netPerHour > 0 ? totalNetPerDay / netPerHour : null,
    totalDaysToDue: dueCandidates.length ? Math.min(...dueCandidates) : daysLeftInMonth,
    totalPerDayFull: totalNetPerDayFull * fuelFactor,
  }
}

/* --------------------------------------------------- Goals */

export interface GoalProgress {
  pct: number
  moneyLeft: number
  initial: number
  paid: number
  daysLeft: number | null
  debtsCount: number
  done: boolean
}

function goalDebts(goal: DebtGoal, debts: Debt[]): Debt[] {
  if (goal.kind === 'all') return debts
  if (goal.kind === 'type') return debts.filter((d) => d.type === goal.debt_type)
  return debts.filter((d) => d.id === goal.debt_id)
}

export function goalProgress(goal: DebtGoal, debts: Debt[]): GoalProgress {
  const list = goalDebts(goal, debts)
  const initial = list.reduce((a, d) => a + d.initial_balance, 0)
  const current = list.reduce((a, d) => a + d.balance, 0)
  const paid = Math.max(0, initial - current)
  const daysLeft = goal.target_date
    ? differenceInCalendarDays(new Date(goal.target_date), new Date())
    : null
  return {
    pct: safeDiv(paid, initial) * 100,
    moneyLeft: current,
    initial,
    paid,
    daysLeft,
    debtsCount: list.length,
    done: current <= 0.5 && list.length > 0,
  }
}

/* --------------------------------------------- Upcoming / calendar */

export type Urgency = 'red' | 'yellow' | 'green'

export interface CalendarItem {
  id: string
  date: Date
  daysUntil: number
  title: string
  subtitle: string
  amount: number | null
  category: ReminderCategory
  urgency: Urgency
}

export function nextMonthlyDate(day: number, ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), day)
  if (d < new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())) {
    return new Date(ref.getFullYear(), ref.getMonth() + 1, day)
  }
  return d
}

function urgencyFor(days: number): Urgency {
  if (days <= 2) return 'red'
  if (days <= 7) return 'yellow'
  return 'green'
}

/** Debt cut/due dates + fixed expenses + reminders, sorted by proximity. */
export function buildCalendar(
  debts: Debt[],
  reminders: Reminder[],
  ref = new Date(),
  fixedExpenses: FixedExpense[] = [],
): CalendarItem[] {
  const items: CalendarItem[] = []

  for (const f of fixedExpenses.filter((x) => x.active && x.due_day)) {
    const date = nextMonthlyDate(f.due_day!, ref)
    const days = differenceInCalendarDays(date, ref)
    items.push({
      id: `fix-${f.id}`,
      date,
      daysUntil: days,
      title: f.name,
      subtitle: 'Gasto fijo',
      amount: f.amount || null,
      category: 'fijo',
      urgency: urgencyFor(days),
    })
  }

  for (const d of debts.filter((x) => x.status === 'active')) {
    if (d.due_day) {
      const date = nextMonthlyDate(d.due_day, ref)
      const days = differenceInCalendarDays(date, ref)
      items.push({
        id: `due-${d.id}`,
        date,
        daysUntil: days,
        title: `Pago ${d.name}`,
        subtitle: debtTypeMeta(d.type).label,
        amount: d.min_payment || null,
        category: 'pago',
        urgency: urgencyFor(days),
      })
    }
    if (d.cut_day) {
      const date = nextMonthlyDate(d.cut_day, ref)
      const days = differenceInCalendarDays(date, ref)
      items.push({
        id: `cut-${d.id}`,
        date,
        daysUntil: days,
        title: `Corte ${d.name}`,
        subtitle: 'Fecha de corte',
        amount: null,
        category: 'corte',
        urgency: urgencyFor(days),
      })
    }
  }

  for (const r of reminders) {
    let date = new Date(r.date)
    if (r.recurring === 'monthly') date = nextMonthlyDate(new Date(r.date).getDate(), ref)
    const days = differenceInCalendarDays(date, ref)
    if (days < -1 && r.recurring === 'none') continue
    items.push({
      id: `rem-${r.id}`,
      date,
      daysUntil: days,
      title: r.title,
      subtitle: r.note ?? '',
      amount: r.amount,
      category: r.category,
      urgency: urgencyFor(days),
    })
  }

  return items.sort((a, b) => a.daysUntil - b.daysUntil)
}

/* --------------------------------------------------- Alerts */

export type AlertTone = 'negative' | 'warning' | 'info' | 'positive'
export interface DebtAlert {
  id: string
  tone: AlertTone
  icon: string
  title: string
  message: string
}

export function generateDebtAlerts(debts: Debt[], payments: DebtPayment[]): DebtAlert[] {
  const alerts: DebtAlert[] = []
  const active = debts.filter((d) => d.status === 'active' && d.balance > 0)
  const interestDebts = active.filter(hasInterest)

  // 1) Minimum-only on an interest debt
  for (const d of interestDebts) {
    if (d.target_payment > 0 && d.target_payment <= d.min_payment) {
      alerts.push({
        id: `min-${d.id}`,
        tone: 'warning',
        icon: 'AlertTriangle',
        title: 'Solo pagas el mínimo',
        message: `En "${d.name}" solo cubres el mínimo. Pagarás más intereses y tardarás más. Sube el pago objetivo.`,
      })
    }
    // Minimum barely covers interest
    const interest = d.balance * monthlyRate(d)
    if (d.min_payment > 0 && d.min_payment < interest * 1.1) {
      alerts.push({
        id: `neg-${d.id}`,
        tone: 'negative',
        icon: 'TrendingDown',
        title: 'El mínimo casi no baja el capital',
        message: `El mínimo de "${d.name}" apenas cubre los intereses del mes. La deuda casi no baja.`,
      })
    }
  }

  // 2) Prioritizing a no-interest debt over an interest one (avalanche rule)
  const noInterest = active.filter((d) => !hasInterest(d))
  if (interestDebts.length > 0 && noInterest.length > 0) {
    const maxNoInterestTarget = Math.max(...noInterest.map((d) => d.target_payment))
    const topInterest = sortAvalanche(active)[0]
    if (topInterest && hasInterest(topInterest) && maxNoInterestTarget > topInterest.target_payment) {
      alerts.push({
        id: 'no-interest-priority',
        tone: 'warning',
        icon: 'Info',
        title: 'Estás priorizando una deuda sin interés',
        message: `Abonas más a una deuda sin interés que a "${topInterest.name}" (${topInterest.interest_rate}%). Según Avalancha, primero las de mayor interés.`,
      })
    }
  }

  // 3) Total monthly interest cost
  const monthlyInterest = active.reduce((a, d) => a + d.balance * monthlyRate(d), 0)
  if (monthlyInterest > 0) {
    alerts.push({
      id: 'monthly-interest',
      tone: 'info',
      icon: 'Flame',
      title: 'Costo de tus intereses',
      message: `Tus deudas generan intereses de forma automática cada mes. Reducir las de mayor tasa primero es lo que más te ahorra.`,
    })
  }

  // 4) Progress this month (positive)
  const monthKey = new Date().toISOString().slice(0, 7)
  const paidThisMonth = payments
    .filter((p) => p.date.slice(0, 7) === monthKey)
    .reduce((a, p) => a + p.amount, 0)
  if (paidThisMonth > 0) {
    alerts.push({
      id: 'progress',
      tone: 'positive',
      icon: 'CheckCircle2',
      title: 'Buen ritmo este mes',
      message: `Ya abonaste a tus deudas este mes. Cada abono reduce el interés que pagas. ¡Sigue así!`,
    })
  }

  return alerts
}

/* --------------------------------------------------- Motivation */

export function motivationalPhrases(opts: {
  summary: DebtSummary
  recommended: Debt | null
  netPerHour: number
  paidThisMonth: number
  reducedPctThisMonth: number
}): string[] {
  const phrases: string[] = []
  const { summary, recommended, netPerHour, reducedPctThisMonth } = opts

  if (recommended && netPerHour > 0) {
    const hours = Math.ceil(hoursToPay(recommended.balance, netPerHour))
    phrases.push(
      `Te faltan ~${hours} horas de trabajo para eliminar "${recommended.name}". ¡Tú puedes! 💪`,
    )
  }
  if (summary.pctPaid > 0) {
    phrases.push(`Ya pagaste el ${summary.pctPaid.toFixed(0)}% de tu deuda total. Cada vez más cerca. 🎯`)
  }
  if (reducedPctThisMonth > 0) {
    phrases.push(`Redujiste tu deuda un ${reducedPctThisMonth.toFixed(0)}% este mes. Vas mejor. 📉`)
  }
  if (summary.totalDebt > 0 && summary.activeCount > 0) {
    phrases.push('Estás cada vez más cerca de quedar libre de deudas. No te rindas. 🚀')
  }
  if (summary.activeCount === 0 && summary.paidCount > 0) {
    phrases.push('🎉 ¡Felicidades! No tienes deudas activas. Eres libre financieramente.')
  }
  return phrases
}
