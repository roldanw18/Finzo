import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { useMoney } from '@/hooks/useMoney'
import type { MonthPoint } from '@/lib/analytics'

export function IncomeExpenseBars({
  data,
  height = 280,
}: {
  data: MonthPoint[]
  height?: number
}) {
  const { money } = useMoney()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={6} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => money(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--c-surface-3) / 0.3)' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => (
            <span className="text-xs text-muted">{v === 'income' ? 'Ingresos' : 'Gastos'}</span>
          )}
        />
        <Bar dataKey="income" fill="rgb(var(--c-income))" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" fill="rgb(var(--c-expense))" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
