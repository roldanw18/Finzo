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
import { uid } from '@/lib/utils'
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

const KEY = 'finzo:data:v1'
const LOCAL_USER = 'local-user'

interface Store {
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

function defaultProfile(): Profile {
  return {
    id: LOCAL_USER,
    display_name: 'Invitado',
    currency: 'COP',
    theme: 'dark',
    opening_balance: 0,
    budgets: {},
    activity_type: null,
    work_days_per_week: 7,
    income_label: 'Ingreso',
    cost_label: 'Costos',
    cost_factor: 1.2,
    onboarded: false,
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
      parsed.debts ??= []
      parsed.debtPayments ??= []
      parsed.goals ??= []
      parsed.workSessions ??= []
      parsed.reminders ??= []
      parsed.fixedExpenses ??= []
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
    debts: [],
    debtPayments: [],
    goals: [],
    workSessions: [],
    reminders: [],
    fixedExpenses: [],
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
      source: input.source ?? 'main',
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

  // ---------------- Debt freedom plan ----------------

  async createDebt(input: DebtInput): Promise<Debt> {
    const s = read()
    const debt: Debt = {
      id: uid(),
      user_id: LOCAL_USER,
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
      priority: input.priority ?? s.debts.length,
      status: input.status ?? 'active',
      count_in_target: input.count_in_target ?? true,
      created_at: new Date().toISOString(),
    }
    s.debts.push(debt)
    write(s)
    return debt
  }

  async updateDebt(id: string, patch: Partial<DebtInput>): Promise<Debt> {
    const s = read()
    const debt = s.debts.find((d) => d.id === id)
    if (!debt) throw new Error('Deuda no encontrada')
    Object.assign(debt, patch)
    write(s)
    return debt
  }

  async deleteDebt(id: string): Promise<void> {
    const s = read()
    s.debts = s.debts.filter((d) => d.id !== id)
    s.debtPayments = s.debtPayments.filter((p) => p.debt_id !== id)
    s.goals = s.goals.filter((g) => g.debt_id !== id)
    write(s)
  }

  async createPayment(input: PaymentInput): Promise<DebtPayment> {
    const s = read()
    const pay: DebtPayment = {
      id: uid(),
      user_id: LOCAL_USER,
      debt_id: input.debt_id,
      amount: input.amount,
      date: input.date,
      note: input.note ?? null,
      created_at: new Date().toISOString(),
    }
    s.debtPayments.push(pay)
    write(s)
    return pay
  }

  async deletePayment(id: string): Promise<void> {
    const s = read()
    s.debtPayments = s.debtPayments.filter((p) => p.id !== id)
    write(s)
  }

  async createGoal(input: GoalInput): Promise<DebtGoal> {
    const s = read()
    const goal: DebtGoal = {
      id: uid(),
      user_id: LOCAL_USER,
      name: input.name,
      kind: input.kind,
      debt_type: input.debt_type ?? null,
      debt_id: input.debt_id ?? null,
      target_date: input.target_date ?? null,
      created_at: new Date().toISOString(),
    }
    s.goals.push(goal)
    write(s)
    return goal
  }

  async updateGoal(id: string, patch: Partial<GoalInput>): Promise<DebtGoal> {
    const s = read()
    const goal = s.goals.find((g) => g.id === id)
    if (!goal) throw new Error('Meta no encontrada')
    Object.assign(goal, patch)
    write(s)
    return goal
  }

  async deleteGoal(id: string): Promise<void> {
    const s = read()
    s.goals = s.goals.filter((g) => g.id !== id)
    write(s)
  }

  async createWorkSession(input: WorkSessionInput): Promise<WorkSession> {
    const s = read()
    const ws: WorkSession = {
      id: uid(),
      user_id: LOCAL_USER,
      date: input.date,
      hours: input.hours,
      earnings: input.earnings,
      fuel_cost: input.fuel_cost,
      note: input.note ?? null,
      created_at: new Date().toISOString(),
    }
    s.workSessions.push(ws)
    write(s)
    return ws
  }

  async deleteWorkSession(id: string): Promise<void> {
    const s = read()
    s.workSessions = s.workSessions.filter((w) => w.id !== id)
    write(s)
  }

  async createReminder(input: ReminderInput): Promise<Reminder> {
    const s = read()
    const rem: Reminder = {
      id: uid(),
      user_id: LOCAL_USER,
      title: input.title,
      category: input.category,
      date: input.date,
      amount: input.amount ?? null,
      recurring: input.recurring ?? 'none',
      note: input.note ?? null,
      created_at: new Date().toISOString(),
    }
    s.reminders.push(rem)
    write(s)
    return rem
  }

  async updateReminder(id: string, patch: Partial<ReminderInput>): Promise<Reminder> {
    const s = read()
    const rem = s.reminders.find((r) => r.id === id)
    if (!rem) throw new Error('Recordatorio no encontrado')
    Object.assign(rem, patch)
    write(s)
    return rem
  }

  async deleteReminder(id: string): Promise<void> {
    const s = read()
    s.reminders = s.reminders.filter((r) => r.id !== id)
    write(s)
  }

  async createFixedExpense(input: FixedExpenseInput): Promise<FixedExpense> {
    const s = read()
    const fx: FixedExpense = {
      id: uid(),
      user_id: LOCAL_USER,
      name: input.name,
      amount: input.amount,
      category_id: input.category_id ?? null,
      due_day: input.due_day ?? null,
      active: input.active ?? true,
      count_in_target: input.count_in_target ?? true,
      created_at: new Date().toISOString(),
    }
    s.fixedExpenses.push(fx)
    write(s)
    return fx
  }

  async updateFixedExpense(id: string, patch: Partial<FixedExpenseInput>): Promise<FixedExpense> {
    const s = read()
    const fx = s.fixedExpenses.find((f) => f.id === id)
    if (!fx) throw new Error('Gasto fijo no encontrado')
    Object.assign(fx, patch)
    write(s)
    return fx
  }

  async deleteFixedExpense(id: string): Promise<void> {
    const s = read()
    s.fixedExpenses = s.fixedExpenses.filter((f) => f.id !== id)
    write(s)
  }

  async importAll(data: Partial<Snapshot>): Promise<Snapshot> {
    const s = read()
    const next: Store = {
      profile: data.profile ? { ...s.profile, ...data.profile } : s.profile,
      categories: data.categories ?? s.categories,
      incomes: data.incomes ?? s.incomes,
      expenses: data.expenses ?? s.expenses,
      debts: data.debts ?? s.debts,
      debtPayments: data.debtPayments ?? s.debtPayments,
      goals: data.goals ?? s.goals,
      workSessions: data.workSessions ?? s.workSessions,
      reminders: data.reminders ?? s.reminders,
      fixedExpenses: data.fixedExpenses ?? s.fixedExpenses,
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

    // Main income: higher on weekends, some rest days
    if (Math.random() > 0.12) {
      const base = dow === 0 || dow === 6 ? 180000 : 130000
      const amount = Math.round((base + (Math.random() - 0.4) * 80000) / 1000) * 1000
      incomes.push({
        id: uid(),
        user_id: LOCAL_USER,
        amount: Math.max(40000, amount),
        date: iso,
        note: null,
        source: 'main',
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

    // Everyday expenses — resolve categories safely, whatever the seed set is.
    const catId = (name: string) =>
      (cats.find((c) => c.name === name) ?? cats[Math.floor(Math.random() * cats.length)])?.id ??
      null

    if (Math.random() > 0.5) {
      expenses.push(
        mkExpense(catId('Alimentación'), iso, date, 12000 + Math.random() * 20000, 'Almuerzo'),
      )
    }
    if (Math.random() > 0.6) {
      expenses.push(
        mkExpense(catId('Transporte'), iso, date, 8000 + Math.random() * 22000, 'Transporte'),
      )
    }
    if (Math.random() > 0.85) {
      const pool = ['Mercado', 'Compras', 'Servicios', 'Entretenimiento', 'Hogar']
      const name = pool[Math.floor(Math.random() * pool.length)]
      expenses.push(mkExpense(catId(name), iso, date, 15000 + Math.random() * 90000, name))
    }
  }

  s.incomes = incomes
  s.expenses = expenses

  // Demo debts (avalanche showcase)
  const now = new Date().toISOString()
  const mkDebt = (
    name: string,
    creditor: string,
    initial: number,
    balance: number,
    rate: number | null,
    type: Debt['type'],
    min: number,
    cut: number,
    due: number,
  ): Debt => ({
    id: uid(),
    user_id: LOCAL_USER,
    name,
    creditor,
    initial_balance: initial,
    balance,
    interest_rate: rate,
    type,
    min_payment: min,
    target_payment: min,
    cut_day: cut,
    due_day: due,
    priority: 0,
    status: 'active',
    created_at: now,
  })
  s.debts = [
    mkDebt('NU', 'Nu Bank', 6000000, 5200000, 32, 'credit_card', 260000, 3, 18),
    mkDebt('Bancolombia', 'Bancolombia', 8000000, 6400000, 28, 'credit_card', 320000, 15, 2),
    mkDebt('Crédito vehículo', 'Banco de Bogotá', 20000000, 14800000, 18, 'vehicle', 620000, 10, 25),
    mkDebt('Préstamo familiar', 'Tío Jorge', 3000000, 1800000, null, 'family', 200000, 1, 30),
  ]
  const firstDebt = s.debts[0]
  s.debtPayments = [
    {
      id: uid(),
      user_id: LOCAL_USER,
      debt_id: firstDebt.id,
      amount: 800000,
      date: new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10),
      note: 'Abono extra',
      created_at: now,
    },
  ]

  // Demo fixed expenses
  const mkFixed = (name: string, amount: number, due: number): FixedExpense => ({
    id: uid(),
    user_id: LOCAL_USER,
    name,
    amount,
    category_id: null,
    due_day: due,
    active: true,
    created_at: now,
  })
  s.fixedExpenses = [
    mkFixed('Arriendo', 900000, 5),
    mkFixed('Internet + TV', 90000, 12),
    mkFixed('Plan celular', 55000, 20),
    mkFixed('Suscripciones', 45000, 1),
  ]
  write(s)
}

function mkExpense(
  categoryId: string | null,
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
