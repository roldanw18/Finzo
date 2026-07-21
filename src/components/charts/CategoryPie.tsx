import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CategoryTooltip } from './ChartTooltip'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useMoney } from '@/hooks/useMoney'
import { EmptyState } from '@/components/ui/EmptyState'
import { PieChart as PieIcon } from 'lucide-react'
import type { CategorySlice } from '@/lib/analytics'

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  const { money } = useMoney()
  const total = data.reduce((a, s) => a + s.value, 0)
  const top = data.slice(0, 6)

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<PieIcon size={22} />}
        title="Sin gastos en el periodo"
        description="Registra gastos para ver la distribución por categoría."
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted">Total</span>
          <span className="tnum font-display text-lg font-bold">{money(total, { compact: true })}</span>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-2">
        {top.map((s) => (
          <div key={s.id} className="flex min-w-0 items-center gap-2.5">
            <CategoryIcon icon={s.icon} color={s.color} size={14} />
            <span className="min-w-0 flex-1 truncate text-sm text-content">{s.name}</span>
            <span className="tnum shrink-0 text-sm font-semibold text-content">
              {money(s.value, { compact: true })}
            </span>
            <span className="tnum w-11 shrink-0 text-right text-xs text-muted">
              {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
        {data.length > 6 && (
          <p className="pt-1 text-xs text-subtle">+{data.length - 6} categorías más</p>
        )}
      </div>
    </div>
  )
}
