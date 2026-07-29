import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/i18n/dict'

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
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      useAvailableInTarget: false,
      setUseAvailableInTarget: (v) => set({ useAvailableInTarget: v }),
      lang: detectLang(),
      setLang: (v) => set({ lang: v }),
    }),
    { name: 'finzo:prefs' },
  ),
)
