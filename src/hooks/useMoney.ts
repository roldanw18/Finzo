import { useStore } from '@/store/useStore'
import { formatMoney } from '@/lib/utils'
import type { Currency } from '@/types'

/** Returns a money formatter bound to the active profile currency. */
export function useMoney() {
  const currency = useStore((s) => s.profile?.currency ?? 'COP') as Currency
  return {
    currency,
    money: (value: number, opts?: { compact?: boolean; sign?: boolean }) =>
      formatMoney(value, currency, opts),
  }
}
