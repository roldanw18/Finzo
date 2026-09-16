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
  SavingsGoal,
  ThemeMode,
  WorkSession,
} from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/defaultCategories'
import { activityPreset } from '@/config/activities'
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
  SavingsGoalInput,
  Snapshot,
  WorkSessionInput,
} from './db'

const KEY = 'finzo:data:v1'
export const DEMO_KEY = 'finzo:demo:v1'
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
  savingsGoals: SavingsGoal[]
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

function read(key = KEY): Store {
  try {
    const raw = localStorage.getItem(key)
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
      parsed.savingsGoals ??= []
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
    savingsGoals: [],
  }
  write(fresh, key)
  return fresh
}

function write(store: Store, key = KEY): void {
  localStorage.setItem(key, JSON.stringify(store))
}

/** localStorage-backed database used in offline / demo mode. */
export class LocalDatabase implements Database {
  constructor(private key: string = KEY) {}

  async bootstrap(): Promise<Snapshot> {
    const s = read(this.key)
    return structuredClone(s)
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const s = read(this.key)
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
    write(s, this.key)
    return cat
  }

  async updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    const s = read(this.key)
    const cat = s.categories.find((c) => c.id === id)
    if (!cat) throw new Error('Categoría no encontrada')
    Object.assign(cat, patch)
    write(s, this.key)
    return cat
  }

  async deleteCategory(id: string): Promise<void> {
    const s = read(this.key)
    s.categories = s.categories.filter((c) => c.id !== id)
    // Detach expenses from deleted category
    s.expenses = s.expenses.map((e) =>
      e.category_id === id ? { ...e, category_id: null } : e,
    )
    write(s, this.key)
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    const s = read(this.key)
    const map = new Map(orderedIds.map((id, i) => [id, i]))
    s.categories.forEach((c) => {
      if (map.has(c.id)) c.sort_order = map.get(c.id)!
    })
    s.categories.sort((a, b) => a.sort_order - b.sort_order)
    write(s, this.key)
  }

  async createIncome(input: IncomeInput): Promise<Income> {
    const s = read(this.key)
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
    write(s, this.key)
    return inc
  }

  async updateIncome(id: string, patch: Partial<IncomeInput>): Promise<Income> {
    const s = read(this.key)
    const inc = s.incomes.find((i) => i.id === id)
    if (!inc) throw new Error('Ingreso no encontrado')
    Object.assign(inc, patch)
    write(s, this.key)
    return inc
  }

  async deleteIncome(id: string): Promise<void> {
    const s = read(this.key)
    s.incomes = s.incomes.filter((i) => i.id !== id)
    write(s, this.key)
  }

  async createExpense(input: ExpenseInput): Promise<Expense> {
    const s = read(this.key)
    const exp: Expense = {
      id: uid(),
      user_id: LOCAL_USER,
      amount: input.amount,
      category_id: input.category_id,
      date: input.date,
      description: input.description ?? null,
      payment_method: input.payment_method,
      notes: input.notes ?? null,
      on_credit: input.on_credit ?? false,
      debt_id: input.debt_id ?? null,
      created_at: new Date().toISOString(),
    }
    s.expenses.push(exp)
    write(s, this.key)
    return exp
  }

  async updateExpense(id: string, patch: Partial<ExpenseInput>): Promise<Expense> {
    const s = read(this.key)
    const exp = s.expenses.find((e) => e.id === id)
    if (!exp) throw new Error('Gasto no encontrado')
    Object.assign(exp, patch)
    write(s, this.key)
    return exp
  }

  async deleteExpense(id: string): Promise<void> {
    const s = read(this.key)
    s.expenses = s.expenses.filter((e) => e.id !== id)
    write(s, this.key)
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const s = read(this.key)
    s.profile = { ...s.profile, ...patch }
    write(s, this.key)
    return s.profile
  }

  // ---------------- Debt freedom plan ----------------

  async createDebt(input: DebtInput): Promise<Debt> {
    const s = read(this.key)
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
      credit_limit: input.credit_limit ?? null,
      created_at: new Date().toISOString(),
    }
    s.debts.push(debt)
    write(s, this.key)
    return debt
  }

  async updateDebt(id: string, patch: Partial<DebtInput>): Promise<Debt> {
    const s = read(this.key)
    const debt = s.debts.find((d) => d.id === id)
    if (!debt) throw new Error('Deuda no encontrada')
    Object.assign(debt, patch)
    write(s, this.key)
    return debt
  }

  async deleteDebt(id: string): Promise<void> {
    const s = read(this.key)
    s.debts = s.debts.filter((d) => d.id !== id)
    s.debtPayments = s.debtPayments.filter((p) => p.debt_id !== id)
    s.goals = s.goals.filter((g) => g.debt_id !== id)
    write(s, this.key)
  }

  async createPayment(input: PaymentInput): Promise<DebtPayment> {
    const s = read(this.key)
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
    write(s, this.key)
    return pay
  }

  async deletePayment(id: string): Promise<void> {
    const s = read(this.key)
    s.debtPayments = s.debtPayments.filter((p) => p.id !== id)
    write(s, this.key)
  }

  async createGoal(input: GoalInput): Promise<DebtGoal> {
    const s = read(this.key)
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
    write(s, this.key)
    return goal
  }

  async updateGoal(id: string, patch: Partial<GoalInput>): Promise<DebtGoal> {
    const s = read(this.key)
    const goal = s.goals.find((g) => g.id === id)
    if (!goal) throw new Error('Meta no encontrada')
    Object.assign(goal, patch)
    write(s, this.key)
    return goal
  }

  async deleteGoal(id: string): Promise<void> {
    const s = read(this.key)
    s.goals = s.goals.filter((g) => g.id !== id)
    write(s, this.key)
  }

  async createWorkSession(input: WorkSessionInput): Promise<WorkSession> {
    const s = read(this.key)
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
    write(s, this.key)
    return ws
  }

  async deleteWorkSession(id: string): Promise<void> {
    const s = read(this.key)
    s.workSessions = s.workSessions.filter((w) => w.id !== id)
    write(s, this.key)
  }

  async createReminder(input: ReminderInput): Promise<Reminder> {
    const s = read(this.key)
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
    write(s, this.key)
    return rem
  }

  async updateReminder(id: string, patch: Partial<ReminderInput>): Promise<Reminder> {
    const s = read(this.key)
    const rem = s.reminders.find((r) => r.id === id)
    if (!rem) throw new Error('Recordatorio no encontrado')
    Object.assign(rem, patch)
    write(s, this.key)
    return rem
  }

  async deleteReminder(id: string): Promise<void> {
    const s = read(this.key)
    s.reminders = s.reminders.filter((r) => r.id !== id)
    write(s, this.key)
  }

  async createFixedExpense(input: FixedExpenseInput): Promise<FixedExpense> {
    const s = read(this.key)
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
    write(s, this.key)
    return fx
  }

  async updateFixedExpense(id: string, patch: Partial<FixedExpenseInput>): Promise<FixedExpense> {
    const s = read(this.key)
    const fx = s.fixedExpenses.find((f) => f.id === id)
    if (!fx) throw new Error('Gasto fijo no encontrado')
    Object.assign(fx, patch)
    write(s, this.key)
    return fx
  }

  async deleteFixedExpense(id: string): Promise<void> {
    const s = read(this.key)
    s.fixedExpenses = s.fixedExpenses.filter((f) => f.id !== id)
    write(s, this.key)
  }

  async createSavingsGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
    const s = read(this.key)
    const goal: SavingsGoal = {
      id: uid(),
      user_id: LOCAL_USER,
      name: input.name,
      target_amount: input.target_amount,
      saved_amount: input.saved_amount ?? 0,
      target_date: input.target_date ?? null,
      color: input.color ?? '#0ecb81',
      icon: input.icon ?? 'PiggyBank',
      created_at: new Date().toISOString(),
    }
    s.savingsGoals.push(goal)
    write(s, this.key)
    return goal
  }

  async updateSavingsGoal(id: string, patch: Partial<SavingsGoalInput>): Promise<SavingsGoal> {
    const s = read(this.key)
    const goal = s.savingsGoals.find((g) => g.id === id)
    if (!goal) throw new Error('Meta de ahorro no encontrada')
    Object.assign(goal, patch)
    write(s, this.key)
    return goal
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const s = read(this.key)
    s.savingsGoals = s.savingsGoals.filter((g) => g.id !== id)
    write(s, this.key)
  }

  async importAll(data: Partial<Snapshot>): Promise<Snapshot> {
    const s = read(this.key)
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
      savingsGoals: data.savingsGoals ?? s.savingsGoals,
    }
    write(next, this.key)
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

/* ============================================================
   Demo mode — a rich, self-contained dataset in its own store
   (DEMO_KEY), so exploring never touches the user's real data.
   ============================================================ */

export function buildDemoStore(theme: ThemeMode = 'dark'): Store {
  const preset = activityPreset('driver')
  const now = new Date().toISOString()
  const today = new Date()

  const categories: Category[] = preset.categories.map((c, i) => ({
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
  const catId = (name: string) =>
    categories.find((c) => c.name === name)?.id ?? categories[0].id

  const incomes: Income[] = []
  const expenses: Expense[] = []
  for (let d = 165; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const iso = date.toISOString().slice(0, 10)
    const dow = date.getDay()

    if (Math.random() > 0.12) {
      const base = dow === 0 || dow === 6 ? 195000 : 140000
      const amount = Math.round((base + (Math.random() - 0.4) * 90000) / 1000) * 1000
      incomes.push({
        id: uid(), user_id: LOCAL_USER, amount: Math.max(45000, amount),
        date: iso, note: null, source: 'main', created_at: date.toISOString(),
      })
    }
    if (Math.random() > 0.45) {
      const tip = Math.round((2000 + Math.random() * 13000) / 500) * 500
      incomes.push({
        id: uid(), user_id: LOCAL_USER, amount: tip, date: iso, note: null,
        source: 'tip', created_at: date.toISOString(),
      })
    }
    if (Math.random() > 0.25)
      expenses.push(mkExpense(catId('Gasolina'), iso, date, 35000 + Math.random() * 30000, 'Tanqueo'))
    if (Math.random() > 0.5)
      expenses.push(mkExpense(catId('Alimentación'), iso, date, 12000 + Math.random() * 20000, 'Almuerzo'))
    if (Math.random() > 0.72)
      expenses.push(mkExpense(catId('Peajes'), iso, date, 8000 + Math.random() * 12000, 'Peaje'))
    if (Math.random() > 0.85) {
      const pool = ['Mercado', 'Compras', 'Lavado', 'Parqueaderos', 'Entretenimiento', 'Salud', 'Hogar']
      const name = pool[Math.floor(Math.random() * pool.length)]
      expenses.push(mkExpense(catId(name), iso, date, 15000 + Math.random() * 90000, name))
    }
  }

  const mkDebt = (
    name: string, creditor: string, initial: number, balance: number,
    rate: number | null, type: Debt['type'], min: number, cut: number, due: number,
    creditLimit: number | null = null,
  ): Debt => ({
    id: uid(), user_id: LOCAL_USER, name, creditor,
    initial_balance: initial, balance, interest_rate: rate, type,
    min_payment: min, target_payment: min, cut_day: cut, due_day: due,
    priority: 0, status: 'active', count_in_target: true,
    credit_limit: creditLimit, created_at: now,
  })
  const debts: Debt[] = [
    mkDebt('NU', 'Nu Bank', 6000000, 4600000, 32, 'credit_card', 260000, 3, 18, 6000000),
    mkDebt('Bancolombia', 'Bancolombia', 8000000, 6100000, 28, 'credit_card', 320000, 15, 2, 8000000),
    mkDebt('Crédito vehículo', 'Banco de Bogotá', 20000000, 13900000, 18, 'vehicle', 620000, 10, 25),
    mkDebt('Préstamo familiar', 'Tío Jorge', 3000000, 1500000, null, 'family', 200000, 1, 30),
  ]
  const debtPayments: DebtPayment[] = [0, 1, 2].map((m) => ({
    id: uid(), user_id: LOCAL_USER, debt_id: debts[0].id, amount: 400000,
    date: new Date(today.getFullYear(), today.getMonth() - m, 12).toISOString().slice(0, 10),
    note: 'Abono mensual', created_at: now,
  }))

  const fixedExpenses: FixedExpense[] = [
    { name: 'Arriendo', amount: 900000, due_day: 5 },
    { name: 'Internet + TV', amount: 90000, due_day: 12 },
    { name: 'Plan celular', amount: 55000, due_day: 20 },
    { name: 'Suscripciones', amount: 45000, due_day: 1 },
  ].map((f) => ({
    id: uid(), user_id: LOCAL_USER, name: f.name, amount: f.amount,
    category_id: null, due_day: f.due_day, active: true, count_in_target: true, created_at: now,
  }))

  const workSessions: WorkSession[] = []
  for (let d = 10; d >= 0; d--) {
    if (Math.random() > 0.2) {
      const date = new Date(today); date.setDate(today.getDate() - d)
      const hours = 6 + Math.round(Math.random() * 5)
      const earnings = hours * (14000 + Math.random() * 6000)
      workSessions.push({
        id: uid(), user_id: LOCAL_USER, date: date.toISOString().slice(0, 10),
        hours, earnings: Math.round(earnings / 1000) * 1000,
        fuel_cost: Math.round((earnings * 0.22) / 1000) * 1000, note: null, created_at: now,
      })
    }
  }

  const goals: DebtGoal[] = [
    { id: uid(), user_id: LOCAL_USER, name: 'Salir de NU', kind: 'debt', debt_type: null, debt_id: debts[0].id, target_date: null, created_at: now },
    { id: uid(), user_id: LOCAL_USER, name: 'Libre de deudas', kind: 'all', debt_type: null, debt_id: null, target_date: null, created_at: now },
  ]

  const reminders: Reminder[] = [
    { id: uid(), user_id: LOCAL_USER, title: 'SOAT del carro', category: 'soat', date: new Date(today.getFullYear(), today.getMonth() + 1, 8).toISOString().slice(0, 10), amount: 650000, recurring: 'yearly', note: null, created_at: now },
    { id: uid(), user_id: LOCAL_USER, title: 'Técnico-mecánica', category: 'tecnomecanica', date: new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString().slice(0, 10), amount: 280000, recurring: 'yearly', note: null, created_at: now },
    { id: uid(), user_id: LOCAL_USER, title: 'Cambio de aceite', category: 'aceite', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().slice(0, 10), amount: 120000, recurring: 'none', note: null, created_at: now },
  ]

  const savingsGoals: SavingsGoal[] = [
    { id: uid(), user_id: LOCAL_USER, name: 'Fondo de emergencia', target_amount: 3000000, saved_amount: 1150000, target_date: null, color: '#0ecb81', icon: 'ShieldCheck', created_at: now },
    { id: uid(), user_id: LOCAL_USER, name: 'Vacaciones', target_amount: 2000000, saved_amount: 600000, target_date: new Date(today.getFullYear(), today.getMonth() + 5, 1).toISOString().slice(0, 10), color: '#50a0ff', icon: 'Plane', created_at: now },
    { id: uid(), user_id: LOCAL_USER, name: 'Cambio de celular', target_amount: 1800000, saved_amount: 1800000, target_date: null, color: '#a855f7', icon: 'Smartphone', created_at: now },
  ]

  const profile: Profile = {
    id: LOCAL_USER, display_name: 'Demo', currency: 'COP', theme,
    opening_balance: 500000, budgets: {}, activity_type: 'driver',
    work_days_per_week: 6, income_label: 'Viaje', cost_label: 'Gasolina',
    cost_factor: 1.3, onboarded: true, created_at: now,
  }

  return { profile, categories, incomes, expenses, debts, debtPayments, goals, workSessions, reminders, fixedExpenses, savingsGoals }
}

export function seedDemo(theme: ThemeMode = 'dark'): void {
  write(buildDemoStore(theme), DEMO_KEY)
}

export function wipeDemo(): void {
  localStorage.removeItem(DEMO_KEY)
}
