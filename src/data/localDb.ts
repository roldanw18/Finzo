import type { Category, Expense, Income, Profile } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories'
import { uid } from '@/lib/utils'
import type {
  CategoryInput,
  Database,
  ExpenseInput,
  IncomeInput,
  Snapshot,
} from './db'

const KEY = 'finzo:data:v1'
const LOCAL_USER = 'local-user'

interface Store {
  profile: Profile
  categories: Category[]
  incomes: Income[]
  expenses: Expense[]
}

function defaultProfile(): Profile {
  return {
    id: LOCAL_USER,
    display_name: 'Invitado',
    currency: 'COP',
    theme: 'dark',
    opening_balance: 0,
    budgets: {},
    created_at: new Date().toISOString(),
  }
}

function seedCategories(): Category[] {
  const now = new Date().toISOString()
  return DEFAULT_CATEGORIES.map((c, i) => ({
    id: uid(),
    user_id: LOCAL_USER,
    name: c.name,
    color: c.color,
    icon: c.icon,
    type: 'expense' as const,
    sort_order: i,
    is_default: true,
    created_at: now,
  }))
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Store
      // Backfill any missing profile fields
      parsed.profile = { ...defaultProfile(), ...parsed.profile }
      parsed.profile.budgets ??= {}
      return parsed
    }
  } catch {
    /* ignore corrupt store */
  }
  const fresh: Store = {
    profile: defaultProfile(),
    categories: seedCategories(),
    incomes: [],
    expenses: [],
  }
  write(fresh)
  return fresh
}

function write(store: Store): void {
  localStorage.setItem(KEY, JSON.stringify(store))
}

/** localStorage-backed database used in offline / demo mode. */
export class LocalDatabase implements Database {
  async bootstrap(): Promise<Snapshot> {
    const s = read()
    return structuredClone(s)
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const s = read()
    const cat: Category = {
      id: uid(),
      user_id: LOCAL_USER,
      name: input.name,
      color: input.color,
      icon: input.icon,
      type: input.type ?? 'expense',
      sort_order: input.sort_order ?? s.categories.length,
      is_default: false,
      created_at: new Date().toISOString(),
    }
    s.categories.push(cat)
    write(s)
    return cat
  }

  async updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    const s = read()
    const cat = s.categories.find((c) => c.id === id)
    if (!cat) throw new Error('Categoría no encontrada')
    Object.assign(cat, patch)
    write(s)
    return cat
  }

  async deleteCategory(id: string): Promise<void> {
    const s = read()
    s.categories = s.categories.filter((c) => c.id !== id)
    // Detach expenses from deleted category
    s.expenses = s.expenses.map((e) =>
      e.category_id === id ? { ...e, category_id: null } : e,
    )
    write(s)
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    const s = read()
    const map = new Map(orderedIds.map((id, i) => [id, i]))
    s.categories.forEach((c) => {
      if (map.has(c.id)) c.sort_order = map.get(c.id)!
    })
    s.categories.sort((a, b) => a.sort_order - b.sort_order)
    write(s)
  }

  async createIncome(input: IncomeInput): Promise<Income> {
    const s = read()
    const inc: Income = {
      id: uid(),
      user_id: LOCAL_USER,
      amount: input.amount,
      date: input.date,
      note: input.note ?? null,
      source: input.source ?? 'uber',
      created_at: new Date().toISOString(),
    }
    s.incomes.push(inc)
    write(s)
    return inc
  }

  async updateIncome(id: string, patch: Partial<IncomeInput>): Promise<Income> {
    const s = read()
    const inc = s.incomes.find((i) => i.id === id)
    if (!inc) throw new Error('Ingreso no encontrado')
    Object.assign(inc, patch)
    write(s)
    return inc
  }

  async deleteIncome(id: string): Promise<void> {
    const s = read()
    s.incomes = s.incomes.filter((i) => i.id !== id)
    write(s)
  }

  async createExpense(input: ExpenseInput): Promise<Expense> {
    const s = read()
    const exp: Expense = {
      id: uid(),
      user_id: LOCAL_USER,
      amount: input.amount,
      category_id: input.category_id,
      date: input.date,
      description: input.description ?? null,
      payment_method: input.payment_method,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    }
    s.expenses.push(exp)
    write(s)
    return exp
  }

  async updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
    const s = read()
    const exp = s.expenses.find((e) => e.id === id)
    if (!exp) throw new Error('Gasto no encontrado')
    Object.assign(exp, patch)
    write(s)
    return exp
  }

  async deleteExpense(id: string): Promise<void> {
    const s = read()
    s.expenses = s.expenses.filter((e) => e.id !== id)
    write(s)
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const s = read()
    s.profile = { ...s.profile, ...patch }
    write(s)
    return s.profile
  }

  async importAll(data: Partial<Snapshot>): Promise<Snapshot> {
    const s = read()
    const next: Store = {
      profile: data.profile ? { ...s.profile, ...data.profile } : s.profile,
      categories: data.categories ?? s.categories,
      incomes: data.incomes ?? s.incomes,
      expenses: data.expenses ?? s.expenses,
    }
    write(next)
    return structuredClone(next)
  }
}

/** Generates realistic demo data for first-run preview (local mode only). */
export function generateDemoData(): void {
  const s = read()
  if (s.incomes.length > 0 || s.expenses.length > 0) return

  const incomes: Income[] = []
  const expenses: Expense[] = []
  const cats = s.categories
  const today = new Date()

  for (let d = 120; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const iso = date.toISOString().slice(0, 10)
    const dow = date.getDay()

    // Uber income: higher on weekends, some rest days
    if (Math.random() > 0.12) {
      const base = dow === 0 || dow === 6 ? 180000 : 130000
      const amount = Math.round((base + (Math.random() - 0.4) * 80000) / 1000) * 1000
      incomes.push({
        id: uid(),
        user_id: LOCAL_USER,
        amount: Math.max(40000, amount),
        date: iso,
        note: null,
        source: 'uber',
        created_at: date.toISOString(),
      })
    }

    // Occasional tips
    if (Math.random() > 0.4) {
      const tip = Math.round((2000 + Math.random() * 12000) / 500) * 500
      incomes.push({
        id: uid(),
        user_id: LOCAL_USER,
        amount: tip,
        date: iso,
        note: null,
        source: 'tip',
        created_at: date.toISOString(),
      })
    }

    // Daily fuel-ish expenses
    if (Math.random() > 0.25) {
      const cat = cats.find((c) => c.name === 'Gasolina')!
      expenses.push(mkExpense(cat.id, iso, date, 35000 + Math.random() * 30000, 'Tanqueo'))
    }
    if (Math.random() > 0.5) {
      const cat = cats.find((c) => c.name === 'Alimentación')!
      expenses.push(mkExpense(cat.id, iso, date, 12000 + Math.random() * 20000, 'Almuerzo'))
    }
    if (Math.random() > 0.7) {
      const cat = cats.find((c) => c.name === 'Peajes')!
      expenses.push(mkExpense(cat.id, iso, date, 8000 + Math.random() * 12000, 'Peaje'))
    }
    if (Math.random() > 0.85) {
      const pool = ['Mercado', 'Compras', 'Lavado', 'Parqueaderos', 'Entretenimiento']
      const name = pool[Math.floor(Math.random() * pool.length)]
      const cat = cats.find((c) => c.name === name)!
      expenses.push(mkExpense(cat.id, iso, date, 15000 + Math.random() * 90000, name))
    }
  }

  s.incomes = incomes
  s.expenses = expenses
  write(s)
}

function mkExpense(
  categoryId: string,
  iso: string,
  date: Date,
  amount: number,
  description: string,
): Expense {
  const methods = ['cash', 'debit', 'credit', 'transfer'] as const
  return {
    id: uid(),
    user_id: LOCAL_USER,
    amount: Math.round(amount / 500) * 500,
    category_id: categoryId,
    date: iso,
    description,
    payment_method: methods[Math.floor(Math.random() * methods.length)],
    notes: null,
    created_at: date.toISOString(),
  }
}

export function wipeLocal(): void {
  localStorage.removeItem(KEY)
}
