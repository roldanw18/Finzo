import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { useMoney } from '@/hooks/useMoney'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  dataKey: string
  xKey: string
  color?: string
  height?: number
}

export function LineTrend({
  data,
  dataKey,
  xKey,
  color = 'rgb(var(--c-primary))',
  height = 240,
}: Props) {
  const { money } = useMoney()
  const gid = `area-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} dy={6} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => money(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gid})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
