import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Scale, Wallet, PiggyBank, Landmark } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'

/**
 * Patrimonio neto = (disponible + ahorros) − deudas.
 * Savings goals are tracked as a separate bucket (contributions don't touch
 * cash), so they add to assets alongside available cash.
 */
export function NetWorthCard() {
  const { kpis, debts } = useAnalytics()
  const savingsGoals = useStore((s) => s.savingsGoals)
  const { money } = useMoney()

  const { available, savings, liabilities, netWorth, assets } = useMemo(() => {
    const available = Math.max(0, kpis.available)
    const savings = savingsGoals.reduce((a, g) => a + g.saved_amount, 0)
    const liabilities = debts
      .filter((d) => d.status === 'active')
      .reduce((a, d) => a + d.balance, 0)
    const assets = available + savings
    return { available, savings, liabilities, assets, netWorth: assets - liabilities }
  }, [kpis.available, savingsGoals, debts])

  // Nothing meaningful to show yet.
  if (assets === 0 && liabilities === 0) return null

  const denom = Math.max(assets, liabilities, 1)
  const assetsPct = (assets / denom) * 100
  const liabPct = (liabilities / denom) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted">
            <Scale size={16} />
            <span className="text-sm">Patrimonio neto</span>
          </div>
          <p
            className={`tnum mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl ${
              netWorth >= 0 ? 'text-content' : 'text-expense'
            }`}
          >
            {money(netWorth, { sign: true })}
          </p>
          <p className="mt-0.5 text-xs text-subtle">Lo que tienes menos lo que debes</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
          <Scale size={22} />
        </span>
      </div>

      {/* Assets vs liabilities bars */}
      <div className="mt-4 space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-income" /> Activos
            </span>
            <span className="tnum font-semibold text-income">{money(assets, { compact: true })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-income transition-all" style={{ width: `${assetsPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-expense" /> Deudas
            </span>
            <span className="tnum font-semibold text-expense">{money(liabilities, { compact: true })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-expense transition-all" style={{ width: `${liabPct}%` }} />
          </div>
        </div>
      </div>

      {/* Breakdown chips */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-2 p-2.5">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <Wallet size={12} /> Disponible
          </p>
          <p className="tnum mt-0.5 text-sm font-bold text-content">
            {money(available, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 p-2.5">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <PiggyBank size={12} /> Ahorros
          </p>
          <p className="tnum mt-0.5 text-sm font-bold text-content">
            {money(savings, { compact: true })}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 p-2.5">
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <Landmark size={12} /> Deudas
          </p>
          <p className="tnum mt-0.5 text-sm font-bold text-expense">
            {money(liabilities, { compact: true })}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
