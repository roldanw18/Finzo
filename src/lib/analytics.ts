import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subDays,
  eachMonthOfInterval,
  eachDayOfInterval,
  isWithinInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Category, Expense, Income, Movement } from '@/types'
import { paymentMethodLabel } from '@/types'
import { pctChange, safeDiv } from './utils'

export interface DateRange {
  start: Date
  end: Date
}

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd')

function inRange(iso: string, range: DateRange): boolean {
  const d = parseISO(iso)
  return isWithinInterval(d, { start: range.start, end: range.end })
}

export function sum<T>(arr: T[], pick: (x: T) => number): number {
  return arr.reduce((acc, x) => acc + pick(x), 0)
}

/* ------------------------------------------------------------------ KPIs */

export interface Kpis {
  available: number
  todayIncome: number
  todayExpense: number
  monthIncome: number
  monthExpense: number
  monthBalance: number
  totalSavings: number
  dailyAvgExpense: number
  dailyAvgIncome: number
  prevMonthExpense: number
  prevMonthBalance: number
  expenseChangePct: number
  balanceChangePct: number
  trend: 'up' | 'down' | 'flat'
  savingsRate: number // % of income kept this month
  todayTips: number
  monthTips: number
}

export function computeKpis(
  incomes: Income[],
  expenses: Expense[],
  openingBalance: number,
  ref = new Date(),
): Kpis {
  const todayIso = format(ref, 'yyyy-MM-dd')
  const monthRange: DateRange = { start: startOfMonth(ref), end: endOfMonth(ref) }
  const prevRef = subMonths(ref, 1)
  const prevRange: DateRange = {
    start: startOfMonth(prevRef),
    end: endOfMonth(prevRef),
  }

  const totalIncome = sum(incomes, (i) => i.amount)
  const totalExpense = sum(expenses, (e) => e.amount)

  const todayIncome = sum(
    incomes.filter((i) => i.date === todayIso),
    (i) => i.amount,
  )
  const todayExpense = sum(
    expenses.filter((e) => e.date === todayIso),
    (e) => e.amount,
  )

  const monthIncome = sum(
    incomes.filter((i) => inRange(i.date, monthRange)),
    (i) => i.amount,
  )
  const monthExpense = sum(
    expenses.filter((e) => inRange(e.date, monthRange)),
    (e) => e.amount,
  )
  const prevMonthIncome = sum(
    incomes.filter((i) => inRange(i.date, prevRange)),
    (i) => i.amount,
  )
  const prevMonthExpense = sum(
    expenses.filter((e) => inRange(e.date, prevRange)),
    (e) => e.amount,
  )

  const todayTips = sum(
    incomes.filter((i) => i.source === 'tip' && i.date === todayIso),
    (i) => i.amount,
  )
  const monthTips = sum(
    incomes.filter((i) => i.source === 'tip' && inRange(i.date, monthRange)),
    (i) => i.amount,
  )

  const daysElapsed = ref.getDate()
  const monthBalance = monthIncome - monthExpense
  const prevMonthBalance = prevMonthIncome - prevMonthExpense

  const expenseChangePct = pctChange(monthExpense, prevMonthExpense)
  const balanceChangePct = pctChange(monthBalance, prevMonthBalance)

  const trend: Kpis['trend'] =
    monthBalance > prevMonthBalance + 1
      ? 'up'
      : monthBalance < prevMonthBalance - 1
        ? 'down'
        : 'flat'

  return {
    available: openingBalance + totalIncome - totalExpense,
    todayIncome,
    todayExpense,
    monthIncome,
    monthExpense,
    monthBalance,
    totalSavings: totalIncome - totalExpense,
    dailyAvgExpense: safeDiv(monthExpense, daysElapsed),
    dailyAvgIncome: safeDiv(monthIncome, daysElapsed),
    prevMonthExpense,
    prevMonthBalance,
    expenseChangePct,
    balanceChangePct,
    trend,
    savingsRate: safeDiv(monthBalance, monthIncome) * 100,
    todayTips,
    monthTips,
  }
}

/* ------------------------------------------------- Category breakdown */

export interface CategorySlice {
  id: string
  name: string
  color: string
  icon: string
  value: number
  count: number
  pct: number
}

export function expensesByCategory(
  expenses: Expense[],
  categories: Category[],
  range?: DateRange,
): CategorySlice[] {
  const filtered = range ? expenses.filter((e) => inRange(e.date, range)) : expenses
  const total = sum(filtered, (e) => e.amount)
  const map = new Map<string, { value: number; count: number }>()
  for (const e of filtered) {
    const key = e.category_id ?? 'uncategorized'
    const cur = map.get(key) ?? { value: 0, count: 0 }
    cur.value += e.amount
    cur.count += 1
    map.set(key, cur)
  }
  const slices: CategorySlice[] = []
  for (const [key, agg] of map) {
    const cat = categories.find((c) => c.id === key)
    slices.push({
      id: key,
      name: cat?.name ?? 'Sin categoría',
      color: cat?.color ?? '#94a3b8',
      icon: cat?.icon ?? 'Shapes',
      value: agg.value,
      count: agg.count,
      pct: safeDiv(agg.value, total) * 100,
    })
  }
  return slices.sort((a, b) => b.value - a.value)
}

/* ------------------------------------------------------ Time series */

export interface MonthPoint {
  key: string
  label: string
  income: number
  expense: number
  balance: number
}

export function monthlySeries(
  incomes: Income[],
  expenses: Expense[],
  months = 6,
  ref = new Date(),
): MonthPoint[] {
  const start = startOfMonth(subMonths(ref, months - 1))
  const monthsArr = eachMonthOfInterval({ start, end: ref })
  return monthsArr.map((m) => {
    const key = format(m, 'yyyy-MM')
    const inc = sum(
      incomes.filter((i) => i.date.slice(0, 7) === key),
      (i) => i.amount,
    )
    const exp = sum(
      expenses.filter((e) => e.date.slice(0, 7) === key),
      (e) => e.amount,
    )
    return {
      key,
      label: format(m, 'MMM', { locale: es }),
      income: inc,
      expense: exp,
      balance: inc - exp,
    }
  })
}

export interface DayPoint {
  date: string
  label: string
  income: number
  expense: number
  net: number
  cumulative: number
}

export function dailySeries(
  incomes: Income[],
  expenses: Expense[],
  range: DateRange,
): DayPoint[] {
  const days = eachDayOfInterval({ start: range.start, end: range.end })
  let cumulative = 0
  return days.map((d) => {
    const key = dayKey(d)
    const inc = sum(
      incomes.filter((i) => i.date === key),
      (i) => i.amount,
    )
    const exp = sum(
      expenses.filter((e) => e.date === key),
      (e) => e.amount,
    )
    const net = inc - exp
    cumulative += net
    return {
      date: key,
      label: format(d, 'd', { locale: es }),
      income: inc,
      expense: exp,
      net,
      cumulative,
    }
  })
}

export interface WeekPoint {
  key: string
  label: string
  income: number
  expense: number
  net: number
}

export function weeklySeries(
  incomes: Income[],
  expenses: Expense[],
  weeks = 12,
  ref = new Date(),
): WeekPoint[] {
  const points: WeekPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const day = subDays(ref, i * 7)
    const start = startOfWeek(day, { weekStartsOn: 1 })
    const end = endOfWeek(day, { weekStartsOn: 1 })
    const range = { start, end }
    const inc = sum(
      incomes.filter((x) => inRange(x.date, range)),
      (x) => x.amount,
    )
    const exp = sum(
      expenses.filter((x) => inRange(x.date, range)),
      (x) => x.amount,
    )
    points.push({
      key: format(start, 'yyyy-ww'),
      label: format(start, 'd MMM', { locale: es }),
      income: inc,
      expense: exp,
      net: inc - exp,
    })
  }
  return points
}

export interface YearPoint {
  year: string
  income: number
  expense: number
  balance: number
}

export function annualSeries(incomes: Income[], expenses: Expense[]): YearPoint[] {
  const years = new Set<string>()
  incomes.forEach((i) => years.add(i.date.slice(0, 4)))
  expenses.forEach((e) => years.add(e.date.slice(0, 4)))
  return [...years]
    .sort()
    .map((y) => {
      const inc = sum(
        incomes.filter((i) => i.date.slice(0, 4) === y),
        (i) => i.amount,
      )
      const exp = sum(
        expenses.filter((e) => e.date.slice(0, 4) === y),
        (e) => e.amount,
      )
      return { year: y, income: inc, expense: exp, balance: inc - exp }
    })
}

/* ----------------------------------------------------- Movements */

export function toMovements(
  incomes: Income[],
  expenses: Expense[],
  categories: Category[],
): Movement[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const incMovs: Movement[] = incomes.map((i) => {
    const isTip = i.source === 'tip'
    return {
      id: i.id,
      kind: 'income',
      amount: i.amount,
      date: i.date,
      categoryId: null,
      categoryName: isTip ? 'Propina' : 'Ingreso Uber',
      categoryColor: isTip ? '#14b8a6' : '#0ecb81',
      categoryIcon: isTip ? 'Coins' : 'Car',
      title: i.note || (isTip ? 'Propina' : 'Ingreso Uber'),
      paymentMethod: null,
      notes: i.note,
      createdAt: i.created_at,
    }
  })
  const expMovs: Movement[] = expenses.map((e) => {
    const cat = e.category_id ? catMap.get(e.category_id) : undefined
    return {
      id: e.id,
      kind: 'expense',
      amount: e.amount,
      date: e.date,
      categoryId: e.category_id,
      categoryName: cat?.name ?? 'Sin categoría',
      categoryColor: cat?.color ?? '#94a3b8',
      categoryIcon: cat?.icon ?? 'Shapes',
      title: e.description || cat?.name || 'Gasto',
      paymentMethod: e.payment_method,
      notes: e.notes,
      createdAt: e.created_at,
    }
  })
  return [...incMovs, ...expMovs].sort((a, b) => {
    if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt)
    return b.date.localeCompare(a.date)
  })
}

export { paymentMethodLabel }
