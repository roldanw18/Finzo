import { Plus, CalendarClock, Pencil } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'
import { useDebtModal } from './modalContext'
import { reminderCategoryMeta } from '@/types'
import { fmt } from '@/lib/dates'
import { cn } from '@/lib/utils'

const URGENCY = {
  red: 'text-expense bg-expense/12',
  yellow: 'text-warning bg-warning/12',
  green: 'text-income bg-income/12',
}

export function CalendarTab() {
  const { calendar, reminders } = useDebt()
  const { money } = useMoney()
  const open = useDebtModal()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Calendario financiero</h2>
          <p className="text-xs text-muted">Cortes, pagos y vencimientos del vehículo</p>
        </div>
        <button onClick={() => open({ type: 'reminder' })} className="btn-primary">
          <Plus size={16} /> Recordatorio
        </button>
      </div>

      {/* Agenda */}
      <Card>
        <CardHeader title="Próximas fechas" icon={<CalendarClock size={18} className="text-primary" />} />
        {calendar.length === 0 ? (
          <EmptyState
            title="Nada programado"
            description="Agrega días de corte/pago a tus deudas o crea recordatorios (SOAT, servicios, técnico-mecánica…)."
          />
        ) : (
          <div className="space-y-2">
            {calendar.map((c) => {
              const meta = reminderCategoryMeta(c.category)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 p-2.5">
                  <div className="flex flex-col items-center">
                    <span className={cn('grid h-11 w-11 place-items-center rounded-xl text-sm font-bold', URGENCY[c.urgency])}>
                      {c.date.getDate()}
                    </span>
                    <span className="mt-0.5 text-[10px] uppercase text-subtle">
                      {fmt(c.date.toISOString().slice(0, 10), 'MMM')}
                    </span>
                  </div>
                  <CategoryIcon icon={meta.icon} color={meta.color} size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{c.title}</p>
                    <p className="truncate text-xs text-muted">
                      {c.subtitle || meta.label}
                      {c.daysUntil > 0 ? ` · en ${c.daysUntil} días` : ' · hoy'}
                    </p>
                  </div>
                  {c.amount && (
                    <span className="tnum text-sm font-semibold text-content">
                      {money(c.amount, { compact: true })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Reminders management */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader title="Mis recordatorios" subtitle="Servicios, impuestos, mantenimiento" />
          <div className="space-y-1.5">
            {reminders.map((r) => {
              const meta = reminderCategoryMeta(r.category)
              return (
                <button
                  key={r.id}
                  onClick={() => open({ type: 'reminder', editing: r })}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2"
                >
                  <CategoryIcon icon={meta.icon} color={meta.color} size={15} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{r.title}</p>
                    <p className="text-xs text-muted">
                      {fmt(r.date, "d 'de' MMM")}
                      {r.recurring !== 'none' && (r.recurring === 'monthly' ? ' · mensual' : ' · anual')}
                    </p>
                  </div>
                  {r.amount && (
                    <span className="tnum text-sm text-muted">{money(r.amount, { compact: true })}</span>
                  )}
                  <Pencil size={14} className="text-subtle" />
                </button>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
