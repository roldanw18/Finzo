import { create } from 'zustand'
import type {
  Category,
  Currency,
  Expense,
  Income,
  Profile,
  ThemeMode,
} from '@/types'
import type {
  CategoryInput,
  Database,
  ExpenseInput,
  IncomeInput,
  Snapshot,
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
      set({ status: 'auth', user: null, db: null, profile: null, expenses: [], incomes: [] })
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
