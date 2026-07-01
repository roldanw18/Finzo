import { motion } from 'framer-motion'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useMoney } from '@/hooks/useMoney'
import { EmptyState } from '@/components/ui/EmptyState'
import { Trophy } from 'lucide-react'
import type { CategorySlice } from '@/lib/analytics'

export function CategoryRanking({
  data,
  limit = 8,
}: {
  data: CategorySlice[]
  limit?: number
}) {
  const { money } = useMoney()
  const items = data.slice(0, limit)
  const max = items[0]?.value ?? 1

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={22} />}
        title="Aún no hay datos"
        description="Registra gastos para ver el ranking de categorías."
      />
    )
  }

  return (
    <div className="space-y-3.5">
      {items.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <span className="w-4 text-center text-xs font-bold text-subtle">{i + 1}</span>
          <CategoryIcon icon={s.icon} color={s.color} size={15} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-content">{s.name}</span>
              <span className="tnum shrink-0 text-sm font-semibold text-content">
                {money(s.value, { compact: true })}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(s.value / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: s.color }}
              />
            </div>
          </div>
          <span className="tnum w-10 shrink-0 text-right text-xs text-muted">
            {s.pct.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  )
}
