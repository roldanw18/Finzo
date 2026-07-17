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
