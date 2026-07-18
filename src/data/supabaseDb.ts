import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Category,
  Debt,
  DebtGoal,
  DebtPayment,
  Expense,
  FixedExpense,
  Income,
  Profile,
  Reminder,
  WorkSession,
} from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories'
import type {
  CategoryInput,
  Database,
  DebtInput,
  ExpenseInput,
  FixedExpenseInput,
  GoalInput,
  IncomeInput,
  PaymentInput,
  ReminderInput,
  Snapshot,
  WorkSessionInput,
} from './db'

/** Supabase-backed database. Row-level security scopes everything to user. */
export class SupabaseDatabase implements Database {
  constructor(
    private sb: SupabaseClient,
    private userId: string,
    private email?: string,
  ) {}

  async bootstrap(): Promise<Snapshot> {
    const profile = await this.ensureProfile()
    let categories = await this.fetchCategories()
    if (categories.length === 0) {
      categories = await this.seedCategories()
    }
    const [incomes, expenses, debts, debtPayments, goals, workSessions, reminders, fixedExpenses] =
      await Promise.all([
        this.fetchIncomes(),
        this.fetchExpenses(),
        this.safeList<Debt>('debts', 'priority', true),
        this.safeList<DebtPayment>('debt_payments', 'date', false),
        this.safeList<DebtGoal>('debt_goals', 'created_at', true),
        this.safeList<WorkSession>('work_sessions', 'date', false),
        this.safeList<Reminder>('reminders', 'date', true),
        this.safeList<FixedExpense>('fixed_expenses', 'created_at', true),
      ])
    return {
      profile,
      categories,
      incomes,
      expenses,
      debts,
      debtPayments,
      goals,
      workSessions,
      reminders,
      fixedExpenses,
    }
  }

  /** Fetches a table, returning [] if it doesn't exist yet (migration pending). */
  private async safeList<T>(table: string, orderCol: string, asc: boolean): Promise<T[]> {
    try {
      const { data, error } = await this.sb
        .from(table)
        .select('*')
        .order(orderCol, { ascending: asc })
      if (error) throw error
      return (data ?? []) as T[]
    } catch {
      return []
    }
  }

  private async ensureProfile(): Promise<Profile> {
    const { data, error } = await this.sb
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .maybeSingle()
    if (error) throw error
    if (data) return data as Profile

    const insert = {
      id: this.userId,
      display_name: this.email?.split('@')[0] ?? null,
      currency: 'COP',
      theme: 'dark',
      opening_balance: 0,
      budgets: {},
    }
    const { data: created, error: insErr } = await this.sb
      .from('profiles')
      .insert(insert)
      .select()
      .single()
    if (insErr) throw insErr
    return created as Profile
  }

  private async seedCategories(): Promise<Category[]> {
    const rows = DEFAULT_CATEGORIES.map((c, i) => ({
      user_id: this.userId,
      name: c.name,
      color: c.color,
      icon: c.icon,
      type: 'expense',
      sort_order: i,
      is_default: true,
    }))
    const { data, error } = await this.sb
      .from('categories')
      .insert(rows)
      .select()
    if (error) throw error
    return (data as Category[]).sort((a, b) => a.sort_order - b.sort_order)
  }

  private async fetchCategories(): Promise<Category[]> {
    const { data, error } = await this.sb
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data as Category[]
  }

  private async fetchIncomes(): Promise<Income[]> {
    const { data, error } = await this.sb
      .from('incomes')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return data as Income[]
  }

  private async fetchExpenses(): Promise<Expense[]> {
    const { data, error } = await this.sb
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return data as Expense[]
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const { data, error } = await this.sb
      .from('categories')
      .insert({
        user_id: this.userId,
        name: input.name,
        color: input.color,
        icon: input.icon,
        type: input.type ?? 'expense',
        sort_order: input.sort_order ?? 999,
        is_default: false,
      })
      .select()
      .single()
    if (error) throw error
    return data as Category
  }

  async updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    const { data, error } = await this.sb
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Category
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.sb.from('categories').delete().eq('id', id)
    if (error) throw error
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, i) =>
        this.sb.from('categories').update({ sort_order: i }).eq('id', id),
      ),
    )
  }

  async createIncome(input: IncomeInput): Promise<Income> {
    const { data, error } = await this.sb
      .from('incomes')
      .insert({
        user_id: this.userId,
        amount: input.amount,
        date: input.date,
        note: input.note ?? null,
        source: input.source ?? 'uber',
      })
      .select()
      .single()
    if (error) throw error
    return data as Income
  }

  async updateIncome(id: string, patch: Partial<IncomeInput>): Promise<Income> {
    const { data, error } = await this.sb
      .from('incomes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Income
  }

  async deleteIncome(id: string): Promise<void> {
    const { error } = await this.sb.from('incomes').delete().eq('id', id)
    if (error) throw error
  }

  async createExpense(input: ExpenseInput): Promise<Expense> {
    const { data, error } = await this.sb
      .from('expenses')
      .insert({
        user_id: this.userId,
        amount: input.amount,
        category_id: input.category_id,
        date: input.date,
        description: input.description ?? null,
        payment_method: input.payment_method,
        notes: input.notes ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Expense
  }

  async updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
    const { data, error } = await this.sb
      .from('expenses')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Expense
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.sb.from('expenses').delete().eq('id', id)
    if (error) throw error
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.sb
      .from('profiles')
      .update(patch)
      .eq('id', this.userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  }

  // ---------------- Debt freedom plan ----------------

  private async insert<T>(table: string, row: object): Promise<T> {
    const { data, error } = await this.sb
      .from(table)
      .insert({ ...row, user_id: this.userId })
      .select()
      .single()
    if (error) throw error
    return data as T
  }
  private async patch<T>(table: string, id: string, patch: object): Promise<T> {
    const { data, error } = await this.sb
      .from(table)
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as T
  }
  private async remove(table: string, id: string): Promise<void> {
    const { error } = await this.sb.from(table).delete().eq('id', id)
    if (error) throw error
  }

  createDebt(input: DebtInput) {
    return this.insert<Debt>('debts', {
      name: input.name,
      creditor: input.creditor ?? '',
      initial_balance: input.initial_balance,
      balance: input.balance,
      interest_rate: input.interest_rate ?? null,
      type: input.type ?? 'other',
      min_payment: input.min_payment ?? 0,
      target_payment: input.target_payment ?? 0,
      cut_day: input.cut_day ?? null,
      due_day: input.due_day ?? null,
      priority: input.priority ?? 0,
      status: input.status ?? 'active',
    })
  }
  updateDebt(id: string, patch: Partial<DebtInput>) {
    return this.patch<Debt>('debts', id, patch)
  }
  deleteDebt(id: string) {
    return this.remove('debts', id)
  }

  createPayment(input: PaymentInput) {
    return this.insert<DebtPayment>('debt_payments', {
      debt_id: input.debt_id,
      amount: input.amount,
      date: input.date,
      note: input.note ?? null,
    })
  }
  deletePayment(id: string) {
    return this.remove('debt_payments', id)
  }

  createGoal(input: GoalInput) {
    return this.insert<DebtGoal>('debt_goals', {
      name: input.name,
      kind: input.kind,
      debt_type: input.debt_type ?? null,
      debt_id: input.debt_id ?? null,
      target_date: input.target_date ?? null,
    })
  }
  updateGoal(id: string, patch: Partial<GoalInput>) {
    return this.patch<DebtGoal>('debt_goals', id, patch)
  }
  deleteGoal(id: string) {
    return this.remove('debt_goals', id)
  }

  createWorkSession(input: WorkSessionInput) {
    return this.insert<WorkSession>('work_sessions', {
      date: input.date,
      hours: input.hours,
      earnings: input.earnings,
      fuel_cost: input.fuel_cost,
      note: input.note ?? null,
    })
  }
  deleteWorkSession(id: string) {
    return this.remove('work_sessions', id)
  }

  createReminder(input: ReminderInput) {
    return this.insert<Reminder>('reminders', {
      title: input.title,
      category: input.category,
      date: input.date,
      amount: input.amount ?? null,
      recurring: input.recurring ?? 'none',
      note: input.note ?? null,
    })
  }
  updateReminder(id: string, patch: Partial<ReminderInput>) {
    return this.patch<Reminder>('reminders', id, patch)
  }
  deleteReminder(id: string) {
    return this.remove('reminders', id)
  }

  createFixedExpense(input: FixedExpenseInput) {
    return this.insert<FixedExpense>('fixed_expenses', {
      name: input.name,
      amount: input.amount,
      category_id: input.category_id ?? null,
      due_day: input.due_day ?? null,
      active: input.active ?? true,
    })
  }
  updateFixedExpense(id: string, patch: Partial<FixedExpenseInput>) {
    return this.patch<FixedExpense>('fixed_expenses', id, patch)
  }
  deleteFixedExpense(id: string) {
    return this.remove('fixed_expenses', id)
  }

  async importAll(data: Partial<Snapshot>): Promise<Snapshot> {
    // Best-effort bulk replace for the current user.
    if (data.categories) {
      await this.sb.from('categories').delete().eq('user_id', this.userId)
      await this.sb.from('categories').insert(
        data.categories.map((c) => ({ ...c, user_id: this.userId })),
      )
    }
    if (data.incomes) {
      await this.sb.from('incomes').delete().eq('user_id', this.userId)
      await this.sb.from('incomes').insert(
        data.incomes.map((i) => ({ ...i, user_id: this.userId })),
      )
    }
    if (data.expenses) {
      await this.sb.from('expenses').delete().eq('user_id', this.userId)
      await this.sb.from('expenses').insert(
        data.expenses.map((e) => ({ ...e, user_id: this.userId })),
      )
    }
    if (data.profile) {
      await this.updateProfile(data.profile)
    }
    return this.bootstrap()
  }
}
