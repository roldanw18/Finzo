import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Client-side display preferences (per device), persisted to localStorage. */
interface Prefs {
  /** Subtract available cash from obligations in the daily income goal. */
  useAvailableInTarget: boolean
  setUseAvailableInTarget: (v: boolean) => void
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      useAvailableInTarget: false,
      setUseAvailableInTarget: (v) => set({ useAvailableInTarget: v }),
    }),
    { name: 'finzo:prefs' },
  ),
)
