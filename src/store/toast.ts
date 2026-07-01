import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  tone: ToastTone
  message: string
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: ToastTone) => void
  dismiss: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (m: string) => useToast.getState().push(m, 'success'),
  error: (m: string) => useToast.getState().push(m, 'error'),
  info: (m: string) => useToast.getState().push(m, 'info'),
}
