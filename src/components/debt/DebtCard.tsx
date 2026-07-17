import { motion } from 'framer-motion'
import { Pencil, CheckCircle2 } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useMoney } from '@/hooks/useMoney'
import { debtTypeMeta, type Debt } from '@/types'
import { hasInterest } from '@/lib/debt'
import { cn, safeDiv } from '@/lib/utils'

interface Props {
  debt: Debt
  rank?: number
  onEdit?: () => void
  onPay?: () => void
}

export function DebtCard({ debt, rank, onEdit, onPay }: Props) {
  const { money } = useMoney()
  const meta = debtTypeMeta(debt.type)
  const paid = Math.max(0, debt.initial_balance - debt.balance)
  const pct = safeDiv(paid, debt.initial_balance) * 100
  const done = debt.status === 'paid'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('card p-4', done && 'opacity-70')}
    >
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {rank}
          </span>
        )}
        <CategoryIcon icon={meta.icon} color={meta.color} size={18} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-content">{debt.name}</p>
            {done && <CheckCircle2 size={15} className="shrink-0 text-income" />}
          </div>
          <p className="truncate text-xs text-muted">
            {debt.creditor || meta.label}
          </p>
        </div>
        <div className="text-right">
          <p className="tnum font-display text-base font-bold text-content">
            {money(debt.balance)}
          </p>
          {hasInterest(debt) ? (
            <span className="chip bg-expense/12 text-[10px] font-semibold text-expense">
              {debt.interest_rate}% anual
            </span>
          ) : (
            <span className="chip bg-income/12 text-[10px] font-semibold text-income">
              Sin interés
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Pagado {pct.toFixed(0)}%</span>
          <span>Inicial {money(debt.initial_balance, { compact: true })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: done ? 'rgb(var(--c-income))' : meta.color }}
          />
        </div>
      </div>

      {(onEdit || onPay) && (
        <div className="mt-3 flex gap-2">
          {onPay && !done && (
            <button onClick={onPay} className="btn-ghost flex-1 py-2 text-xs">
              Registrar pago
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="btn-outline py-2 text-xs">
              <Pencil size={13} /> Editar
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
