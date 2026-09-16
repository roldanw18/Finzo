import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/i18n/dict'
import type { Currency } from '@/types'
import { FALLBACK_USD_COP } from '@/lib/exchange'

function detectLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en'
  }
  return 'es'
}

/** Client-side display preferences (per device), persisted to localStorage. */
interface Prefs {
  /** Subtract available cash from obligations in the daily income goal. */
  useAvailableInTarget: boolean
  setUseAvailableInTarget: (v: boolean) => void
  /** UI language. */
  lang: Lang
  setLang: (v: Lang) => void
  /**
   * Currency to DISPLAY amounts in. null = show them in the base currency
   * (profile.currency) as stored. This is a view-only overlay: it never
   * changes stored data, so switching back always shows the exact originals.
   */
  displayCurrency: Currency | null
  setDisplayCurrency: (v: Currency | null) => void
  /** Exchange rate used for the display overlay: COP per 1 USD. */
  rate: number
  setRate: (v: number) => void
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      useAvailableInTarget: false,
      setUseAvailableInTarget: (v) => set({ useAvailableInTarget: v }),
      lang: detectLang(),
      setLang: (v) => set({ lang: v }),
      displayCurrency: null,
      setDisplayCurrency: (v) => set({ displayCurrency: v }),
      rate: FALLBACK_USD_COP,
      setRate: (v) => set({ rate: v }),
    }),
    { name: 'finzo:prefs' },
  ),
)
