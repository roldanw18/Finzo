import { useNavigate } from 'react-router-dom'
import { CategoryIcon } from './ui/CategoryIcon'
import { useMoney } from '@/hooks/useMoney'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { relativeDay } from '@/lib/dates'
import { DEBT_PAYMENT_CATEGORY } from '@/lib/analytics'
import { paymentMethodLabel, type Movement } from '@/types'
import { cn } from '@/lib/utils'

export function MovementRow({ m, showDate = true }: { m: Movement; showDate?: boolean }) {
  const { money } = useMoney()
  const navigate = useNavigate()
  const openIncome = useUI((s) => s.openIncome)
  const openExpense = useUI((s) => s.openExpense)
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)

  function onClick() {
    if (m.categoryId === DEBT_PAYMENT_CATEGORY.id) {
      navigate('/plan')
      return
    }
    if (m.kind === 'income') {
      const inc = incomes.find((i) => i.id === m.id)
      if (inc) openIncome(inc)
    } else {
      const exp = expenses.find((e) => e.id === m.id)
      if (exp) openExpense(exp)
    }
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-2"
    >
      <CategoryIcon icon={m.categoryIcon} color={m.categoryColor} size={17} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-content">{m.title}</p>
        <p className="truncate text-xs text-muted">
          {m.categoryName}
          {m.paymentMethod && ` · ${paymentMethodLabel(m.paymentMethod)}`}
          {showDate && ` · ${relativeDay(m.date)}`}
        </p>
      </div>
      <span
        className={cn(
          'tnum shrink-0 text-sm font-semibold',
          m.kind === 'income' ? 'text-income' : 'text-content',
        )}
      >
        {m.kind === 'income' ? '+' : '−'}
        {money(m.amount)}
      </span>
    </button>
  )
}
