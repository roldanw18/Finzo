import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  debtSummary,
  sortAvalanche,
  nextRecommendedDebt,
  generateDebtAlerts,
  uberStats,
  buildCalendar,
  simulatePayoff,
  motivationalPhrases,
  dailyEarningTargets,
  monthlyAllocation,
  projectDebts,
} from '@/lib/debt'
import { pctChange } from '@/lib/utils'

/** Shared, memoized debt-plan computations from the store. */
export function useDebt() {
  const debts = useStore((s) => s.debts)
  const payments = useStore((s) => s.debtPayments)
  const goals = useStore((s) => s.goals)
  const workSessions = useStore((s) => s.workSessions)
  const reminders = useStore((s) => s.reminders)

  const active = useMemo(
    () => debts.filter((d) => d.status === 'active'),
    [debts],
  )
  const summary = useMemo(() => debtSummary(debts, payments), [debts, payments])
  const avalanche = useMemo(() => sortAvalanche(debts), [debts])
  const recommendation = useMemo(() => nextRecommendedDebt(debts), [debts])
  const alerts = useMemo(() => generateDebtAlerts(debts, payments), [debts, payments])
  const uber = useMemo(() => uberStats(workSessions), [workSessions])
  const calendar = useMemo(() => buildCalendar(debts, reminders), [debts, reminders])
  const basePlan = useMemo(() => simulatePayoff(debts, 0), [debts])
  const dailyTargets = useMemo(
    () => dailyEarningTargets(debts, payments, uber.netPerHour),
    [debts, payments, uber.netPerHour],
  )
  const allocation = useMemo(() => monthlyAllocation(debts, 0), [debts])
  const projection = useMemo(() => projectDebts(debts, 0), [debts])

  const reducedPctThisMonth = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    const paidThisMonth = payments
      .filter((p) => p.date.slice(0, 7) === monthKey)
      .reduce((a, p) => a + p.amount, 0)
    return pctChange(summary.totalDebt, summary.totalDebt + paidThisMonth) * -1
  }, [payments, summary.totalDebt])

  const phrases = useMemo(
    () =>
      motivationalPhrases({
        summary,
        recommended: recommendation.debt,
        netPerHour: uber.netPerHour,
        paidThisMonth: 0,
        reducedPctThisMonth: Math.max(0, reducedPctThisMonth),
      }),
    [summary, recommendation, uber.netPerHour, reducedPctThisMonth],
  )

  return {
    debts,
    active,
    payments,
    goals,
    workSessions,
    reminders,
    summary,
    avalanche,
    recommendation,
    alerts,
    uber,
    calendar,
    basePlan,
    dailyTargets,
    allocation,
    projection,
    phrases,
  }
}
