import { createContext, useContext } from 'react'
import type { Debt, DebtGoal, Reminder } from '@/types'

export type DebtModal =
  | { type: 'none' }
  | { type: 'debt'; editing?: Debt }
  | { type: 'payment'; debtId?: string }
  | { type: 'goal'; editing?: DebtGoal }
  | { type: 'work' }
  | { type: 'reminder'; editing?: Reminder }

export const DebtModalContext = createContext<(m: DebtModal) => void>(() => {})
export const useDebtModal = () => useContext(DebtModalContext)
