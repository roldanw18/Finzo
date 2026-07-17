import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category, Expense, Income, Profile } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories'
import type {
  CategoryInput,
  Database,
  ExpenseInput,
  IncomeInput,
  Snapshot,
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
    const [incomes, expenses] = await Promise.all([
      this.fetchIncomes(),
      this.fetchExpenses(),
    ])
    return { profile, categories, incomes, expenses }
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
