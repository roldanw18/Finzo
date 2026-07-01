import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { useMoney } from '@/hooks/useMoney'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  xKey: string
  valueKey?: string
  height?: number
}

/** Net cash-flow bars: green when positive, red when negative. */
export function FlowChart({ data, xKey, valueKey = 'net', height = 240 }: Props) {
  const { money } = useMoney()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} dy={6} minTickGap={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => money(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--c-surface-3) / 0.3)' }} />
        <ReferenceLine y={0} stroke="rgb(var(--c-border))" />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]} maxBarSize={26}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                (d[valueKey] as number) >= 0
                  ? 'rgb(var(--c-income))'
                  : 'rgb(var(--c-expense))'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
