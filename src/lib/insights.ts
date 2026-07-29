import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { Category, Expense, Income } from '@/types'
import {
  computeKpis,
  expensesByCategory,
  monthlySeries,
  annualSeries,
  type DateRange,
} from './analytics'
import { pctChange, safeDiv } from './utils'
import { usePrefs } from '@/store/prefs'
import { translate } from '@/i18n'

const T = (s: string) => translate(s, usePrefs.getState().lang)
/** Fill {placeholders} in a translated template. */
const tf = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), T(s))

export type Tone = 'positive' | 'negative' | 'warning' | 'info' | 'neutral'

export interface Insight {
  id: string
  tone: Tone
  icon: string
  title: string
  description: string
  value?: number // money value, formatted by the UI
  pct?: number
}

export interface Alert {
  id: string
  category: string
  color: string
  icon: string
  current: number
  previous: number
  changePct: number
  tone: Tone
  message: string
}

export interface Recommendation {
  id: string
  icon: string
  title: string
  detail: string
  potentialSaving?: number
}

function monthRange(ref: Date): DateRange {
  return { start: startOfMonth(ref), end: endOfMonth(ref) }
}

/* --------------------------------------------------------- Insights */

export function generateInsights(
  incomes: Income[],
  expenses: Expense[],
  categories: Category[],
  openingBalance: number,
  ref = new Date(),
): Insight[] {
  const out: Insight[] = []
  const kpis = computeKpis(incomes, expenses, openingBalance, ref)
  const byCat = expensesByCategory(expenses, categories, monthRange(ref))
  const allTimeByCat = expensesByCategory(expenses, categories)

  if (byCat.length > 0) {
    const top = byCat[0]
    out.push({
      id: 'top-category',
      tone: 'warning',
      icon: 'Flame',
      title: T('Mayor gasto del mes'),
      description: tf('{cat} concentra el {p}% de tus gastos este mes.', {
        cat: top.name,
        p: top.pct.toFixed(0),
      }),
      value: top.value,
    })

    const bottom = byCat[byCat.length - 1]
    if (byCat.length > 1) {
      out.push({
        id: 'bottom-category',
        tone: 'info',
        icon: 'Leaf',
        title: T('Menor gasto del mes'),
        description: tf('Donde menos gastas es {cat}.', { cat: bottom.name }),
        value: bottom.value,
      })
    }
  }

  out.push({
    id: 'net-profit',
    tone: kpis.monthBalance >= 0 ? 'positive' : 'negative',
    icon: kpis.monthBalance >= 0 ? 'TrendingUp' : 'TrendingDown',
    title: T('Ganancia neta del mes'),
    description:
      kpis.monthBalance >= 0
        ? tf('Llevas un balance positivo este mes. Tasa de ahorro: {r}%.', {
            r: kpis.savingsRate.toFixed(0),
          })
        : T('Tus gastos superan tus ingresos este mes. Revisa tus categorías principales.'),
    value: kpis.monthBalance,
  })

  out.push({
    id: 'daily-avg',
    tone: 'neutral',
    icon: 'CalendarDays',
    title: T('Promedio de gasto diario'),
    description: T('Gasto medio por día en el mes en curso.'),
    value: kpis.dailyAvgExpense,
  })

  out.push({
    id: 'weekly-avg',
    tone: 'neutral',
    icon: 'CalendarRange',
    title: T('Promedio semanal'),
    description: T('Estimación de gasto por semana este mes.'),
    value: kpis.dailyAvgExpense * 7,
  })

  out.push({
    id: 'monthly-avg',
    tone: 'neutral',
    icon: 'Calendar',
    title: T('Promedio mensual (6 meses)'),
    description: T('Gasto promedio de los últimos 6 meses.'),
    value: avgMonthlyExpense(expenses, ref, 6),
  })

  // Trend over last 3 months
  const series = monthlySeries(incomes, expenses, 3, ref)
  if (series.length >= 2) {
    const first = series[0].expense
    const last = series[series.length - 1].expense
    const change = pctChange(last, first)
    out.push({
      id: 'trend',
      tone: change > 5 ? 'negative' : change < -5 ? 'positive' : 'neutral',
      icon: change > 5 ? 'ArrowUpRight' : change < -5 ? 'ArrowDownRight' : 'Minus',
      title: T('Tendencia de gastos'),
      description:
        change > 5
          ? tf('Tus gastos crecieron {c}% en los últimos meses.', { c: change.toFixed(0) })
          : change < -5
            ? tf('Reduces gastos: {c}% menos que hace 3 meses.', {
                c: Math.abs(change).toFixed(0),
              })
            : T('Tus gastos se mantienen estables.'),
      pct: change,
    })
  }

  // Month vs month
  out.push({
    id: 'mom',
    tone: kpis.expenseChangePct > 0 ? 'warning' : 'positive',
    icon: 'GitCompareArrows',
    title: T('Comparación con el mes anterior'),
    description:
      kpis.expenseChangePct > 0
        ? tf('Gastas {p}% más que el mes pasado.', { p: kpis.expenseChangePct.toFixed(0) })
        : tf('Gastas {p}% menos que el mes pasado.', {
            p: Math.abs(kpis.expenseChangePct).toFixed(0),
          }),
    pct: kpis.expenseChangePct,
  })

  // Year vs year
  const years = annualSeries(incomes, expenses)
  if (years.length >= 2) {
    const cur = years[years.length - 1]
    const prev = years[years.length - 2]
    const change = pctChange(cur.expense, prev.expense)
    out.push({
      id: 'yoy',
      tone: change > 0 ? 'warning' : 'positive',
      icon: 'CalendarClock',
      title: tf('Comparación {a} vs {b}', { a: prev.year, b: cur.year }),
      description:
        change >= 0
          ? tf('Este año gastas {c}% más que el anterior.', { c: change.toFixed(0) })
          : tf('Este año gastas {c}% menos que el anterior.', {
              c: Math.abs(change).toFixed(0),
            }),
      pct: change,
    })
  }

  // Biggest single category all-time
  if (allTimeByCat.length > 0) {
    out.push({
      id: 'lifetime-top',
      tone: 'info',
      icon: 'Trophy',
      title: T('Categoría histórica top'),
      description: tf('Históricamente, {cat} es tu mayor gasto.', { cat: allTimeByCat[0].name }),
      value: allTimeByCat[0].value,
    })
  }

  return out
}

function avgMonthlyExpense(expenses: Expense[], ref: Date, months: number): number {
  const series = monthlySeries([], expenses, months, ref)
  const withData = series.filter((s) => s.expense > 0)
  return safeDiv(
    withData.reduce((a, s) => a + s.expense, 0),
    Math.max(withData.length, 1),
  )
}

/* --------------------------------------------------------- Alerts */

export function generateAlerts(
  expenses: Expense[],
  categories: Category[],
  ref = new Date(),
): Alert[] {
  const cur = expensesByCategory(expenses, categories, monthRange(ref))
  const prevRef = subMonths(ref, 1)
  const prev = expensesByCategory(expenses, categories, monthRange(prevRef))
  const prevMap = new Map(prev.map((p) => [p.id, p.value]))

  const alerts: Alert[] = []
  for (const c of cur) {
    const previous = prevMap.get(c.id) ?? 0
    if (previous === 0) {
      if (c.value > 0 && c.count >= 1 && c.value >= medianValue(cur)) {
        alerts.push({
          id: `new-${c.id}`,
          category: c.name,
          color: c.color,
          icon: c.icon,
          current: c.value,
          previous: 0,
          changePct: 100,
          tone: 'info',
          message: tf('Nuevo gasto relevante en {cat} este mes.', { cat: c.name }),
        })
      }
      continue
    }
    const change = pctChange(c.value, previous)
    if (change >= 25 && c.value - previous > 0) {
      alerts.push({
        id: `up-${c.id}`,
        category: c.name,
        color: c.color,
        icon: c.icon,
        current: c.value,
        previous,
        changePct: change,
        tone: change >= 60 ? 'negative' : 'warning',
        message: tf('{cat} subió {c}% respecto al mes anterior.', {
          cat: c.name,
          c: change.toFixed(0),
        }),
      })
    } else if (change <= -25) {
      alerts.push({
        id: `down-${c.id}`,
        category: c.name,
        color: c.color,
        icon: c.icon,
        current: c.value,
        previous,
        changePct: change,
        tone: 'positive',
        message: tf('Bajaste {c}% en {cat}. ¡Bien!', {
          c: Math.abs(change).toFixed(0),
          cat: c.name,
        }),
      })
    }
  }
  return alerts.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
}

function medianValue(slices: { value: number }[]): number {
  if (slices.length === 0) return 0
  const sorted = [...slices].map((s) => s.value).sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/* ------------------------------------------------- Recommendations */

export function generateRecommendations(
  incomes: Income[],
  expenses: Expense[],
  categories: Category[],
  openingBalance: number,
  ref = new Date(),
  costCategory?: string,
): Recommendation[] {
  const recs: Recommendation[] = []
  const kpis = computeKpis(incomes, expenses, openingBalance, ref)
  const byCat = expensesByCategory(expenses, categories, monthRange(ref))

  // 1. Trim the top category by 10%
  if (byCat.length > 0 && byCat[0].value > 0) {
    const top = byCat[0]
    const saving = top.value * 0.1
    recs.push({
      id: 'trim-top',
      icon: 'Scissors',
      title: tf('Optimiza {cat}', { cat: top.name }),
      detail: T('Es tu mayor gasto del mes. Reducirlo un 10% liberaría dinero cada mes.'),
      potentialSaving: saving,
    })
  }

  // 2. Subscriptions review
  const subs = byCat.find((c) => /suscrip/i.test(c.name))
  if (subs && subs.value > 0) {
    recs.push({
      id: 'subs',
      icon: 'Repeat',
      title: T('Revisa tus suscripciones'),
      detail: T('Estás pagando suscripciones este mes. Cancela las que no uses.'),
      potentialSaving: subs.value * 0.4,
    })
  }

  // 3. Savings target based on income
  if (kpis.monthIncome > 0) {
    const target = kpis.monthIncome * 0.2
    if (kpis.monthBalance < target) {
      recs.push({
        id: 'savings-target',
        icon: 'PiggyBank',
        title: T('Meta de ahorro 20%'),
        detail: T('Apunta a ahorrar el 20% de tus ingresos. Te faltan para la meta de este mes.'),
        potentialSaving: target - Math.max(kpis.monthBalance, 0),
      })
    } else {
      recs.push({
        id: 'savings-ok',
        icon: 'Trophy',
        title: T('¡Vas por buen camino!'),
        detail: T('Ya superas la meta de ahorro del 20% este mes. Considera invertir el excedente.'),
      })
    }
  }

  // 4. Daily spend control
  if (kpis.dailyAvgExpense > 0 && kpis.dailyAvgIncome > 0) {
    const ratio = safeDiv(kpis.dailyAvgExpense, kpis.dailyAvgIncome)
    if (ratio > 0.7) {
      recs.push({
        id: 'daily-control',
        icon: 'GaugeCircle',
        title: T('Controla el gasto diario'),
        detail: tf('Gastas el {p}% de lo que ingresas a diario. Intenta bajar del 70%.', {
          p: (ratio * 100).toFixed(0),
        }),
        potentialSaving: (kpis.dailyAvgExpense - kpis.dailyAvgIncome * 0.7) * 30,
      })
    }
  }

  // 5. Operating cost weighs too much on income (fuel, supplies, stock…)
  if (costCategory && kpis.monthIncome > 0) {
    const cost = byCat.find((c) => c.name.toLowerCase() === costCategory.toLowerCase())
    if (cost) {
      const ratio = safeDiv(cost.value, kpis.monthIncome) * 100
      if (ratio > 25) {
        recs.push({
          id: 'operating-cost',
          icon: 'Fuel',
          title: tf('{cat} elevado', { cat: cost.name }),
          detail: tf(
            '{cat} representa el {p}% de tus ingresos. Busca proveedores o formas de reducirlo.',
            { cat: cost.name, p: ratio.toFixed(0) },
          ),
          potentialSaving: cost.value * 0.12,
        })
      }
    }
  }

  return recs
}
