export type Currency = 'COP' | 'USD'

export type ThemeMode = 'dark' | 'light'

/** Where an income came from. 'tip' = propina, the rest is Uber income. */
export type IncomeSource = 'uber' | 'tip'

export type PaymentMethod =
  | 'cash'
  | 'debit'
  | 'credit'
  | 'transfer'
  | 'wallet'
  | 'other'

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  /** Reserved for future income categories; expenses for now. */
  type: 'expense' | 'income'
  sort_order: number
  is_default: boolean
  created_at: string
}

export interface Income {
  id: string
  user_id: string
  amount: number
  date: string // ISO yyyy-MM-dd
  note: string | null
  /** Defaults to 'uber' for legacy rows without the column. */
  source?: IncomeSource
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  category_id: string | null
  date: string // ISO yyyy-MM-dd
  description: string | null
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
}

export interface Profile {
  id: string // = auth user id
  display_name: string | null
  currency: Currency
  theme: ThemeMode
  /** Optional starting balance carried before tracking began. */
  opening_balance: number
  /** Per-category monthly budgets, keyed by category id. */
  budgets: Record<string, number>
  created_at: string
}

/* ------------------------------------------------ Debt freedom plan */

export type DebtType = 'credit_card' | 'loan' | 'family' | 'vehicle' | 'other'
export type DebtStatus = 'active' | 'paid'

export interface Debt {
  id: string
  user_id: string
  name: string
  creditor: string
  /** Balance when first registered — baseline for % paid. */
  initial_balance: number
  balance: number
  /** Annual interest rate as a percent. null / 0 = sin interés. */
  interest_rate: number | null
  type: DebtType
  min_payment: number
  target_payment: number
  /** Day of month (1-31) or null. */
  cut_day: number | null
  due_day: number | null
  priority: number
  status: DebtStatus
  /** Whether this debt counts toward the daily income goal. Defaults to true. */
  count_in_target?: boolean
  created_at: string
}

export interface DebtPayment {
  id: string
  user_id: string
  debt_id: string
  amount: number
  date: string
  note: string | null
  created_at: string
}

export type GoalKind = 'all' | 'type' | 'debt'

export interface DebtGoal {
  id: string
  user_id: string
  name: string
  kind: GoalKind
  debt_type: DebtType | null
  debt_id: string | null
  target_date: string | null
  created_at: string
}

export interface WorkSession {
  id: string
  user_id: string
  date: string
  hours: number
  earnings: number
  fuel_cost: number
  note: string | null
  created_at: string
}

export interface FixedExpense {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string | null
  due_day: number | null
  active: boolean
  created_at: string
}

export type ReminderCategory =
  | 'corte'
  | 'pago'
  | 'fijo'
  | 'servicio'
  | 'impuesto'
  | 'soat'
  | 'mantenimiento'
  | 'aceite'
  | 'tecnomecanica'
  | 'otro'

export interface Reminder {
  id: string
  user_id: string
  title: string
  category: ReminderCategory
  date: string // yyyy-MM-dd
  amount: number | null
  recurring: 'none' | 'monthly' | 'yearly'
  note: string | null
  created_at: string
}

export const DEBT_TYPES: { value: DebtType; label: string; icon: string; color: string }[] = [
  { value: 'credit_card', label: 'Tarjeta de crédito', icon: 'CreditCard', color: '#f6465d' },
  { value: 'loan', label: 'Préstamo', icon: 'Landmark', color: '#f0b90b' },
  { value: 'family', label: 'Familiar', icon: 'Users', color: '#50a0ff' },
  { value: 'vehicle', label: 'Vehículo', icon: 'Car', color: '#a855f7' },
  { value: 'other', label: 'Otra', icon: 'Shapes', color: '#94a3b8' },
]

export function debtTypeMeta(t: DebtType) {
  return DEBT_TYPES.find((d) => d.value === t) ?? DEBT_TYPES[4]
}

export const REMINDER_CATEGORIES: { value: ReminderCategory; label: string; icon: string; color: string }[] = [
  { value: 'corte', label: 'Fecha de corte', icon: 'Scissors', color: '#f0b90b' },
  { value: 'pago', label: 'Fecha de pago', icon: 'CalendarCheck', color: '#f6465d' },
  { value: 'fijo', label: 'Gasto fijo', icon: 'Repeat', color: '#8b5cf6' },
  { value: 'servicio', label: 'Servicio', icon: 'Zap', color: '#50a0ff' },
  { value: 'impuesto', label: 'Impuesto', icon: 'Landmark', color: '#ec4899' },
  { value: 'soat', label: 'SOAT', icon: 'ShieldCheck', color: '#14b8a6' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: 'Wrench', color: '#fb923c' },
  { value: 'aceite', label: 'Cambio de aceite', icon: 'Droplet', color: '#8b5cf6' },
  { value: 'tecnomecanica', label: 'Técnico-mecánica', icon: 'ClipboardCheck', color: '#22c55e' },
  { value: 'otro', label: 'Otro', icon: 'Bell', color: '#94a3b8' },
]

export function reminderCategoryMeta(c: ReminderCategory) {
  return REMINDER_CATEGORIES.find((r) => r.value === c) ?? REMINDER_CATEGORIES[8]
}

/** A unified movement used by history / exports. */
export type MovementKind = 'income' | 'expense'

export interface Movement {
  id: string
  kind: MovementKind
  amount: number
  date: string
  categoryId: string | null
  categoryName: string
  categoryColor: string
  categoryIcon: string
  title: string
  paymentMethod: PaymentMethod | null
  notes: string | null
  createdAt: string
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Efectivo', icon: 'Banknote' },
  { value: 'debit', label: 'Tarjeta débito', icon: 'CreditCard' },
  { value: 'credit', label: 'Tarjeta crédito', icon: 'CreditCard' },
  { value: 'transfer', label: 'Transferencia', icon: 'ArrowLeftRight' },
  { value: 'wallet', label: 'Billetera digital', icon: 'Wallet' },
  { value: 'other', label: 'Otro', icon: 'CircleDollarSign' },
]

export function paymentMethodLabel(m: PaymentMethod | null): string {
  return PAYMENT_METHODS.find((p) => p.value === m)?.label ?? 'Otro'
}
