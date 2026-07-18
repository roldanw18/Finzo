import type {
  Category,
  Debt,
  DebtGoal,
  DebtPayment,
  DebtStatus,
  DebtType,
  Expense,
  FixedExpense,
  GoalKind,
  Income,
  IncomeSource,
  PaymentMethod,
  Profile,
  Reminder,
  ReminderCategory,
  WorkSession,
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

export interface DebtInput {
  name: string
  creditor?: string
  initial_balance: number
  balance: number
  interest_rate?: number | null
  type?: DebtType
  min_payment?: number
  target_payment?: number
  cut_day?: number | null
  due_day?: number | null
  priority?: number
  status?: DebtStatus
  count_in_target?: boolean
}

export interface PaymentInput {
  debt_id: string
  amount: number
  date: string
  note?: string | null
}

export interface GoalInput {
  name: string
  kind: GoalKind
  debt_type?: DebtType | null
  debt_id?: string | null
  target_date?: string | null
}

export interface WorkSessionInput {
  date: string
  hours: number
  earnings: number
  fuel_cost: number
  note?: string | null
}

export interface ReminderInput {
  title: string
  category: ReminderCategory
  date: string
  amount?: number | null
  recurring?: 'none' | 'monthly' | 'yearly'
  note?: string | null
}

export interface FixedExpenseInput {
  name: string
  amount: number
  category_id?: string | null
  due_day?: number | null
  active?: boolean
}

export interface Snapshot {
  profile: Profile
  categories: Category[]
  incomes: Income[]
  expenses: Expense[]
  debts: Debt[]
  debtPayments: DebtPayment[]
  goals: DebtGoal[]
  workSessions: WorkSession[]
  reminders: Reminder[]
  fixedExpenses: FixedExpense[]
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

  // Debt freedom plan
  createDebt(input: DebtInput): Promise<Debt>
  updateDebt(id: string, patch: Partial<DebtInput>): Promise<Debt>
  deleteDebt(id: string): Promise<void>

  createPayment(input: PaymentInput): Promise<DebtPayment>
  deletePayment(id: string): Promise<void>

  createGoal(input: GoalInput): Promise<DebtGoal>
  updateGoal(id: string, patch: Partial<GoalInput>): Promise<DebtGoal>
  deleteGoal(id: string): Promise<void>

  createWorkSession(input: WorkSessionInput): Promise<WorkSession>
  deleteWorkSession(id: string): Promise<void>

  createReminder(input: ReminderInput): Promise<Reminder>
  updateReminder(id: string, patch: Partial<ReminderInput>): Promise<Reminder>
  deleteReminder(id: string): Promise<void>

  createFixedExpense(input: FixedExpenseInput): Promise<FixedExpense>
  updateFixedExpense(id: string, patch: Partial<FixedExpenseInput>): Promise<FixedExpense>
  deleteFixedExpense(id: string): Promise<void>

  /** Replace all data (used by import). */
  importAll(data: Partial<Snapshot>): Promise<Snapshot>
}
