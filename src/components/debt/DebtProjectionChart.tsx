import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useMoney } from '@/hooks/useMoney'
import type { DebtProjection } from '@/lib/debt'

interface TP {
  active?: boolean
  label?: string | number
  payload?: { name?: string; value?: number; color?: string }[]
}

export function DebtProjectionChart({
  projection,
  height = 260,
}: {
  projection: DebtProjection
  height?: number
}) {
  const { money } = useMoney()
  const { series, order } = projection

  const Tip = ({ active, label, payload }: TP) => {
    if (!active || !payload || payload.length === 0) return null
    const total = payload.reduce((a, p) => a + (Number(p.value) || 0), 0)
    return (
      <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-card-lg backdrop-blur">
        <p className="mb-1 text-xs font-semibold text-content">{label}</p>
        {payload
          .filter((p) => (Number(p.value) || 0) > 0)
          .map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="tnum font-semibold text-content">{money(Number(p.value) || 0)}</span>
            </div>
          ))}
        <div className="mt-1 border-t border-border/60 pt-1 text-xs">
          <span className="text-muted">Total: </span>
          <span className="tnum font-bold text-content">{money(total)}</span>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
        <defs>
          {order.map((o) => (
            <linearGradient key={o.id} id={`g-${o.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={o.color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={o.color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} dy={6} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => money(v, { compact: true })}
        />
        <Tooltip content={<Tip />} />
        {order.map((o) => (
          <Area
            key={o.id}
            type="monotone"
            dataKey={o.id}
            name={o.name}
            stackId="1"
            stroke={o.color}
            strokeWidth={1.5}
            fill={`url(#g-${o.id})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
