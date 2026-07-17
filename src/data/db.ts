import type {
  Category,
  Expense,
  Income,
  IncomeSource,
  PaymentMethod,
  Profile,
} from '@/types'

export interface CategoryInput {
  name: string
  color: string
  icon: string
  type?: 'expense' | 'income'
  sort_order?: number
}

export interface IncomeInput {
  amount: number
  date: string
  note?: string | null
  source?: IncomeSource
}

export interface ExpenseInput {
  amount: number
  category_id: string | null
  date: string
  description?: string | null
  payment_method: PaymentMethod
  notes?: string | null
}

export interface Snapshot {
  profile: Profile
  categories: Category[]
  incomes: Income[]
  expenses: Expense[]
}

/** Storage-agnostic data access contract. */
export interface Database {
  /** Loads everything for the current user, seeding defaults if empty. */
  bootstrap(): Promise<Snapshot>

  createCategory(input: CategoryInput): Promise<Category>
  updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category>
  deleteCategory(id: string): Promise<void>
  reorderCategories(orderedIds: string[]): Promise<void>

  createIncome(input: IncomeInput): Promise<Income>
  updateIncome(id: string, patch: Partial<IncomeInput>): Promise<Income>
  deleteIncome(id: string): Promise<void>

  createExpense(input: ExpenseInput): Promise<Expense>
  updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense>
  deleteExpense(id: string): Promise<void>

  updateProfile(patch: Partial<Profile>): Promise<Profile>

  /** Replace all data (used by import). */
  importAll(data: Partial<Snapshot>): Promise<Snapshot>
}
