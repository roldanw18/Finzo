import { NavLink } from 'react-router-dom'
import { Wallet, Moon, Sun, LogOut, TrendingUp, TrendingDown } from 'lucide-react'
import { NAV_ITEMS } from '@/config/nav'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { useMoney } from '@/hooks/useMoney'
import { computeKpis } from '@/lib/analytics'
import { cn, initials } from '@/lib/utils'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

export function Sidebar() {
  const profile = useStore((s) => s.profile)
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const setTheme = useStore((s) => s.setTheme)
  const signOut = useStore((s) => s.signOut)
  const mode = useStore((s) => s.mode)
  const openIncome = useUI((s) => s.openIncome)
  const openExpense = useUI((s) => s.openExpense)
  const { currency } = useMoney()

  const kpis = computeKpis(incomes, expenses, profile?.opening_balance ?? 0)
  const dark = profile?.theme !== 'light'

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-bg-soft px-4 py-5 lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-contrast">
          <Wallet size={20} strokeWidth={2.4} />
        </span>
        <div>
          <p className="font-display text-lg font-bold leading-none">Finzo</p>
          <p className="text-[10px] text-subtle">Finanzas personales</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs text-muted">Dinero disponible</p>
        <AnimatedNumber
          value={kpis.available}
          currency={currency}
          className="tnum mt-1 block font-display text-2xl font-bold text-content"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => openIncome()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-income/12 py-2 text-xs font-semibold text-income transition hover:bg-income/20"
          >
            <TrendingUp size={14} /> Ingreso
          </button>
          <button
            onClick={() => openExpense()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-expense/12 py-2 text-xs font-semibold text-expense transition hover:bg-expense/20"
          >
            <TrendingDown size={14} /> Gasto
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'nav-link-active')
            }
          >
            <item.icon size={19} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-2">
        <button
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className="nav-link w-full"
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold uppercase text-primary">
            {initials(profile?.display_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.display_name ?? 'Usuario'}</p>
            <p className="text-[10px] text-subtle">
              {mode === 'local' ? 'Modo local' : 'Cuenta en la nube'}
            </p>
          </div>
          {mode === 'remote' && (
            <button
              onClick={signOut}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-expense"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
