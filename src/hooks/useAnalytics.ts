import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { computeKpis, toMovements } from '@/lib/analytics'

/** Shared, memoized financial computations derived from the store. */
export function useAnalytics() {
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const profile = useStore((s) => s.profile)
  const opening = profile?.opening_balance ?? 0

  const kpis = useMemo(
    () => computeKpis(incomes, expenses, opening),
    [incomes, expenses, opening],
  )

  const movements = useMemo(
    () => toMovements(incomes, expenses, categories),
    [incomes, expenses, categories],
  )

  return { incomes, expenses, categories, profile, opening, kpis, movements }
}
