import { create } from 'zustand'
import type {
  Category,
  Currency,
  Debt,
  DebtGoal,
  DebtPayment,
  Expense,
  Income,
  Profile,
  Reminder,
  ThemeMode,
  WorkSession,
} from '@/types'
import type {
  CategoryInput,
  Database,
  DebtInput,
  ExpenseInput,
  GoalInput,
  IncomeInput,
  PaymentInput,
  ReminderInput,
  Snapshot,
  WorkSessionInput,
} from '@/data/db'
import { LocalDatabase, generateDemoData, wipeLocal } from '@/data/localDb'
import { SupabaseDatabase } from '@/data/supabaseDb'
import { hasSupabase, supabase } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'ready' | 'auth' | 'error'
export type Mode = 'local' | 'remote'

interface AppState {
  mode: Mode
  status: Status
  error: string | null
  user: { id: string; email?: string } | null
  db: Database | null

  profile: Profile | null
  categories: Category[]
  incomes: Income[]
  expenses: Expense[]
  debts: Debt[]
  debtPayments: DebtPayment[]
  goals: DebtGoal[]
  workSessions: WorkSession[]
  reminders: Reminder[]

  init: () => Promise<void>
  refresh: () => Promise<void>

  // Auth (remote mode)
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>
  signOut: () => Promise<void>

  // CRUD
  addCategory: (input: CategoryInput) => Promise<void>
  editCategory: (id: string, patch: Partial<CategoryInput>) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  reorderCategories: (ids: string[]) => Promise<void>

  addIncome: (input: IncomeInput) => Promise<Income>
  editIncome: (id: string, patch: Partial<IncomeInput>) => Promise<void>
  removeIncome: (id: string) => Promise<void>

  addExpense: (input: ExpenseInput) => Promise<Expense>
  editExpense: (id: string, patch: Partial<ExpenseInput>) => Promise<void>
  removeExpense: (id: string) => Promise<void>

  // Profile / settings
  setTheme: (theme: ThemeMode) => Promise<void>
  setCurrency: (currency: Currency) => Promise<void>
  saveProfile: (patch: Partial<Profile>) => Promise<void>

  // Debt freedom plan
  addDebt: (input: DebtInput) => Promise<void>
  editDebt: (id: string, patch: Partial<DebtInput>) => Promise<void>
  removeDebt: (id: string) => Promise<void>
  addPayment: (input: PaymentInput) => Promise<void>
  removePayment: (payment: DebtPayment) => Promise<void>
  addGoal: (input: GoalInput) => Promise<void>
  editGoal: (id: string, patch: Partial<GoalInput>) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  addWorkSession: (input: WorkSessionInput) => Promise<void>
  removeWorkSession: (id: string) => Promise<void>
  addReminder: (input: ReminderInput) => Promise<void>
  editReminder: (id: string, patch: Partial<ReminderInput>) => Promise<void>
  removeReminder: (id: string) => Promise<void>

  // Data management
  loadDemoData: () => Promise<void>
  resetLocal: () => Promise<void>
  importData: (data: Partial<Snapshot>) => Promise<void>
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0b0e11' : '#f6f7f9')
}

export const useStore = create<AppState>((set, get) => {
  function setSnapshot(s: Snapshot) {
    applyTheme(s.profile.theme)
    set({
      profile: s.profile,
      categories: s.categories,
      incomes: s.incomes,
      expenses: s.expenses,
      debts: s.debts,
      debtPayments: s.debtPayments,
      goals: s.goals,
      workSessions: s.workSessions,
      reminders: s.reminders,
    })
  }

  async function bootstrapWith(db: Database) {
    const snap = await db.bootstrap()
    set({ db })
    setSnapshot(snap)
  }

  return {
    mode: hasSupabase ? 'remote' : 'local',
    status: 'idle',
    error: null,
    user: null,
    db: null,
    profile: null,
    categories: [],
    incomes: [],
    expenses: [],
    debts: [],
    debtPayments: [],
    goals: [],
    workSessions: [],
    reminders: [],

    async init() {
      set({ status: 'loading', error: null })
      try {
        if (!hasSupabase || !supabase) {
          // Local / demo mode
          generateDemoData()
          await bootstrapWith(new LocalDatabase())
          set({ mode: 'local', user: { id: 'local-user' }, status: 'ready' })
          return
        }

        // Remote mode
        const { data } = await supabase.auth.getSession()
        supabase.auth.onAuthStateChange((_evt, session) => {
          const s = get()
          if (session?.user && s.status === 'auth') {
            void s.init()
          }
          if (!session && s.status === 'ready' && s.mode === 'remote') {
            set({ status: 'auth', user: null, db: null })
          }
        })

        const session = data.session
        if (!session?.user) {
          set({ status: 'auth' })
          return
        }
        const u = session.user
        const db = new SupabaseDatabase(supabase, u.id, u.email ?? undefined)
        await bootstrapWith(db)
        set({ user: { id: u.id, email: u.email ?? undefined }, status: 'ready' })
      } catch (e) {
        console.error(e)
        set({ status: 'error', error: (e as Error).message })
      }
    },

    async refresh() {
      const db = get().db
      if (!db) return
      const snap = await db.bootstrap()
      setSnapshot(snap)
    },

    async signIn(email, password) {
      if (!supabase) throw new Error('Supabase no configurado')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await get().init()
    },

    async signUp(email, password) {
      if (!supabase) throw new Error('Supabase no configurado')
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      const needsConfirm = !data.session
      if (data.session) await get().init()
      return { needsConfirm }
    },

    async signOut() {
      if (supabase) await supabase.auth.signOut()
      set({
        status: 'auth',
        user: null,
        db: null,
        profile: null,
        expenses: [],
        incomes: [],
        debts: [],
        debtPayments: [],
        goals: [],
        workSessions: [],
        reminders: [],
      })
    },

    async addCategory(input) {
      const cat = await get().db!.createCategory(input)
      set((s) => ({ categories: [...s.categories, cat] }))
    },
    async editCategory(id, patch) {
      const cat = await get().db!.updateCategory(id, patch)
      set((s) => ({ categories: s.categories.map((c) => (c.id === id ? cat : c)) }))
    },
    async removeCategory(id) {
      await get().db!.deleteCategory(id)
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        expenses: s.expenses.map((e) =>
          e.category_id === id ? { ...e, category_id: null } : e,
        ),
      }))
    },
    async reorderCategories(ids) {
      await get().db!.reorderCategories(ids)
      set((s) => {
        const order = new Map(ids.map((id, i) => [id, i]))
        const next = [...s.categories].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
        )
        return { categories: next.map((c, i) => ({ ...c, sort_order: i })) }
      })
    },

    async addIncome(input) {
      const inc = await get().db!.createIncome(input)
      set((s) => ({ incomes: [inc, ...s.incomes] }))
      return inc
    },
    async editIncome(id, patch) {
      const inc = await get().db!.updateIncome(id, patch)
      set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? inc : i)) }))
    },
    async removeIncome(id) {
      await get().db!.deleteIncome(id)
      set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }))
    },

    async addExpense(input) {
      const exp = await get().db!.createExpense(input)
      set((s) => ({ expenses: [exp, ...s.expenses] }))
      return exp
    },
    async editExpense(id, patch) {
      const exp = await get().db!.updateExpense(id, patch)
      set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? exp : e)) }))
    },
    async removeExpense(id) {
      await get().db!.deleteExpense(id)
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
    },

    async setTheme(theme) {
      applyTheme(theme)
      const profile = await get().db!.updateProfile({ theme })
      set({ profile })
    },
    async setCurrency(currency) {
      const profile = await get().db!.updateProfile({ currency })
      set({ profile })
    },
    async saveProfile(patch) {
      const profile = await get().db!.updateProfile(patch)
      if (patch.theme) applyTheme(patch.theme)
      set({ profile })
    },

    // ---------------- Debt freedom plan ----------------

    async addDebt(input) {
      const debt = await get().db!.createDebt(input)
      set((s) => ({ debts: [...s.debts, debt] }))
    },
    async editDebt(id, patch) {
      const debt = await get().db!.updateDebt(id, patch)
      set((s) => ({ debts: s.debts.map((d) => (d.id === id ? debt : d)) }))
    },
    async removeDebt(id) {
      await get().db!.deleteDebt(id)
      set((s) => ({
        debts: s.debts.filter((d) => d.id !== id),
        debtPayments: s.debtPayments.filter((p) => p.debt_id !== id),
        goals: s.goals.filter((g) => g.debt_id !== id),
      }))
    },
    async addPayment(input) {
      const db = get().db!
      const payment = await db.createPayment(input)
      const debt = get().debts.find((d) => d.id === input.debt_id)
      let updatedDebt: Debt | undefined
      if (debt) {
        const newBalance = Math.max(0, debt.balance - input.amount)
        updatedDebt = await db.updateDebt(debt.id, {
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'active',
        })
      }
      set((s) => ({
        debtPayments: [payment, ...s.debtPayments],
        debts: updatedDebt
          ? s.debts.map((d) => (d.id === updatedDebt!.id ? updatedDebt! : d))
          : s.debts,
      }))
    },
    async removePayment(payment) {
      const db = get().db!
      await db.deletePayment(payment.id)
      // Restore the balance the payment had subtracted
      const debt = get().debts.find((d) => d.id === payment.debt_id)
      let updatedDebt: Debt | undefined
      if (debt) {
        updatedDebt = await db.updateDebt(debt.id, {
          balance: debt.balance + payment.amount,
          status: 'active',
        })
      }
      set((s) => ({
        debtPayments: s.debtPayments.filter((p) => p.id !== payment.id),
        debts: updatedDebt
          ? s.debts.map((d) => (d.id === updatedDebt!.id ? updatedDebt! : d))
          : s.debts,
      }))
    },
    async addGoal(input) {
      const goal = await get().db!.createGoal(input)
      set((s) => ({ goals: [...s.goals, goal] }))
    },
    async editGoal(id, patch) {
      const goal = await get().db!.updateGoal(id, patch)
      set((s) => ({ goals: s.goals.map((g) => (g.id === id ? goal : g)) }))
    },
    async removeGoal(id) {
      await get().db!.deleteGoal(id)
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
    },
    async addWorkSession(input) {
      const ws = await get().db!.createWorkSession(input)
      set((s) => ({ workSessions: [ws, ...s.workSessions] }))
    },
    async removeWorkSession(id) {
      await get().db!.deleteWorkSession(id)
      set((s) => ({ workSessions: s.workSessions.filter((w) => w.id !== id) }))
    },
    async addReminder(input) {
      const rem = await get().db!.createReminder(input)
      set((s) => ({ reminders: [...s.reminders, rem] }))
    },
    async editReminder(id, patch) {
      const rem = await get().db!.updateReminder(id, patch)
      set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? rem : r)) }))
    },
    async removeReminder(id) {
      await get().db!.deleteReminder(id)
      set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }))
    },

    async loadDemoData() {
      generateDemoData()
      await get().refresh()
    },
    async resetLocal() {
      wipeLocal()
      await bootstrapWith(new LocalDatabase())
    },
    async importData(data) {
      const snap = await get().db!.importAll(data)
      setSnapshot(snap)
    },
  }
})
