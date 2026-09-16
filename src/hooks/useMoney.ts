import { useStore } from '@/store/useStore'
import { usePrefs } from '@/store/prefs'
import { formatMoney } from '@/lib/utils'
import type { Currency } from '@/types'

/**
 * Money helper. Amounts are STORED in the base currency (profile.currency) and
 * never rewritten. A per-device display overlay (usePrefs.displayCurrency) can
 * show them in the other currency using a rate — purely visual, so switching
 * back to the base always shows the exact original values.
 */
export function useMoney() {
  const base = useStore((s) => s.profile?.currency ?? 'COP') as Currency
  const displayCurrency = usePrefs((s) => s.displayCurrency)
  const rate = usePrefs((s) => s.rate)

  const view: Currency = displayCurrency ?? base
  const converting = view !== base && rate > 0

  /** Convert a base-currency amount to the view currency (numeric). */
  const convert = (value: number): number => {
    if (!converting) return value
    return view === 'USD' ? value / rate : value * rate
  }

  return {
    /** Currency amounts are stored/entered in (use this for inputs). */
    currency: base,
    base,
    /** Currency currently shown on screen. */
    view,
    converting,
    convert,
    /** Format a base-currency amount for display (converts to the view currency). */
    money: (value: number, opts?: { compact?: boolean; sign?: boolean }) =>
      formatMoney(convert(value), view, opts),
  }
}
