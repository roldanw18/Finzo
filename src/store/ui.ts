import { create } from 'zustand'
import type { Category, Expense, Income } from '@/types'

type ModalState =
  | { type: 'none' }
  | { type: 'income'; editing?: Income }
  | { type: 'expense'; editing?: Expense }
  | { type: 'category'; editing?: Category }
  | { type: 'tip' }

interface UIState {
  modal: ModalState
  fabOpen: boolean
  openIncome: (editing?: Income) => void
  openExpense: (editing?: Expense) => void
  openCategory: (editing?: Category) => void
  openTip: () => void
  closeModal: () => void
  toggleFab: (v?: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  modal: { type: 'none' },
  fabOpen: false,
  openIncome: (editing) => set({ modal: { type: 'income', editing }, fabOpen: false }),
  openExpense: (editing) => set({ modal: { type: 'expense', editing }, fabOpen: false }),
  openCategory: (editing) => set({ modal: { type: 'category', editing }, fabOpen: false }),
  openTip: () => set({ modal: { type: 'tip' }, fabOpen: false }),
  closeModal: () => set({ modal: { type: 'none' } }),
  toggleFab: (v) => set((s) => ({ fabOpen: v ?? !s.fabOpen })),
}))
