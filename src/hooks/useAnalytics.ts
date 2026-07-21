import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { computeKpis, toMovements } from '@/lib/analytics'

/** Shared, memoized financial computations derived from the store. */
export function useAnalytics() {
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const debtPayments = useStore((s) => s.debtPayments)
  const debts = useStore((s) => s.debts)
  const profile = useStore((s) => s.profile)
  const opening = profile?.opening_balance ?? 0

  const kpis = useMemo(
    () => computeKpis(incomes, expenses, opening, new Date(), debtPayments),
    [incomes, expenses, opening, debtPayments],
  )

  const incomeLabel = profile?.income_label
  const movements = useMemo(
    () =>
      toMovements(incomes, expenses, categories, debtPayments, debts, {
        label: incomeLabel,
      }),
    [incomes, expenses, categories, debtPayments, debts, incomeLabel],
  )

  return {
    incomes,
    expenses,
    categories,
    debtPayments,
    debts,
    profile,
    opening,
    kpis,
    movements,
  }
}
