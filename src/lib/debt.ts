import { addMonths, differenceInCalendarDays, endOfMonth, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  Debt,
  DebtGoal,
  DebtPayment,
  Reminder,
  WorkSession,
  ReminderCategory,
} from '@/types'
import { debtTypeMeta } from '@/types'
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

/* --------------------------------------------- Daily income target */

/** Fuel overhead: earn 30% extra so the payment stays "free" after gas. */
export const FUEL_FACTOR = 1.3

export interface DailyTargets {
  daysLeftInMonth: number
  fuelFactor: number
  hasCards: boolean
  hasDebts: boolean
  // Remaining obligation THIS month (net, after what's already paid)
  cardRemaining: number
  allRemaining: number
  targetRemaining: number
  cardMinimums: number
  allMinimums: number
  // Gross daily target = remaining × fuelFactor / days left
  cardPerDay: number
  allPerDay: number
  targetPerDay: number
  // Net portion (the actual payment) per day, and hours of work
  cardNetPerDay: number
  cardHoursPerDay: number | null
}

/**
 * How much to EARN per day (gross, incl. fuel via `fuelFactor`) so the credit
 * card minimums — and optionally all minimums / target pace — stay covered.
 */
export function dailyEarningTargets(
  debts: Debt[],
  debtPayments: DebtPayment[],
  netPerHour = 0,
  ref = new Date(),
  fuelFactor = FUEL_FACTOR,
): DailyTargets {
  const active = debts.filter((d) => d.status === 'active')
  const cards = active.filter((d) => d.type === 'credit_card')
  const monthKey = format(ref, 'yyyy-MM')
  const daysLeft = Math.max(1, endOfMonth(ref).getDate() - ref.getDate() + 1)

  const paidThisMonth = new Map<string, number>()
  for (const p of debtPayments) {
    if (p.date.slice(0, 7) !== monthKey) continue
    paidThisMonth.set(p.debt_id, (paidThisMonth.get(p.debt_id) ?? 0) + p.amount)
  }
  const remainingFor = (list: Debt[], pick: (d: Debt) => number) =>
    list.reduce((a, d) => a + Math.max(0, pick(d) - (paidThisMonth.get(d.id) ?? 0)), 0)

  const cardRemaining = remainingFor(cards, (d) => d.min_payment)
  const allRemaining = remainingFor(active, (d) => d.min_payment)
  const targetRemaining = remainingFor(active, (d) => d.target_payment || d.min_payment)

  return {
    daysLeftInMonth: daysLeft,
    fuelFactor,
    hasCards: cards.length > 0,
    hasDebts: active.length > 0,
    cardRemaining,
    allRemaining,
    targetRemaining,
    cardMinimums: cards.reduce((a, d) => a + d.min_payment, 0),
    allMinimums: active.reduce((a, d) => a + d.min_payment, 0),
    cardPerDay: (cardRemaining * fuelFactor) / daysLeft,
    allPerDay: (allRemaining * fuelFactor) / daysLeft,
    targetPerDay: (targetRemaining * fuelFactor) / daysLeft,
    cardNetPerDay: cardRemaining / daysLeft,
    cardHoursPerDay: netPerHour > 0 ? cardRemaining / daysLeft / netPerHour : null,
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

function nextMonthlyDate(day: number, ref: Date): Date {
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

/** Debt cut/due dates + reminders, sorted by proximity. */
export function buildCalendar(debts: Debt[], reminders: Reminder[], ref = new Date()): CalendarItem[] {
  const items: CalendarItem[] = []

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
