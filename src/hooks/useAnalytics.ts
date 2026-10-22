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
  const savingsGoals = useStore((s) => s.savingsGoals)
  const profile = useStore((s) => s.profile)
  const opening = profile?.opening_balance ?? 0

  // Cash the user has moved into savings goals via contributions — it leaves
  // "disponible" (but not "ahorro acumulado", which is a separate cash-flow metric).
  const reservedInSavings = useMemo(
    () => savingsGoals.reduce((a, g) => a + (g.reserved_from_cash ?? 0), 0),
    [savingsGoals],
  )

  const kpis = useMemo(() => {
    const k = computeKpis(incomes, expenses, opening, new Date(), debtPayments)
    return { ...k, available: k.available - reservedInSavings }
  }, [incomes, expenses, opening, debtPayments, reservedInSavings])

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
