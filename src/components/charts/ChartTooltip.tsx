import { useMoney } from '@/hooks/useMoney'

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

const LABELS: Record<string, string> = {
  income: 'Ingresos',
  expense: 'Gastos',
  balance: 'Balance',
  net: 'Flujo neto',
  cumulative: 'Acumulado',
  value: 'Total',
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}) {
  const { money } = useMoney()
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-card-lg backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 text-xs font-semibold capitalize text-content">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {LABELS[String(item.dataKey)] ?? item.name ?? ''}
            </span>
            <span className="tnum font-semibold text-content">
              {money(Number(item.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Tooltip variant for category pie/ranking (name + value + pct). */
export function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  const { money } = useMoney()
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload as { name: string; value: number; pct: number }
  return (
    <div className="rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-card-lg backdrop-blur">
      <p className="mb-0.5 text-xs font-semibold text-content">{p.name}</p>
      <p className="tnum text-sm font-bold text-content">{money(p.value)}</p>
      <p className="text-[11px] text-muted">{p.pct.toFixed(1)}% del total</p>
    </div>
  )
}
