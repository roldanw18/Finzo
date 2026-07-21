import { Plus, Trash2, Clock, Coins, Gauge } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { useDebt } from '@/hooks/useDebt'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { useDebtModal } from './modalContext'
import { hoursToPay } from '@/lib/debt'
import { fmtShort } from '@/lib/dates'
import { getIcon } from '@/lib/icons'
import { DailyTargetCard } from './DailyTargetCard'

export function WorkTab() {
  const { uber, workSessions, active } = useDebt()
  const { costLabel, workLabel, incomeLabel, icon } = useActivity()
  const ActivityIcon = getIcon(icon)
  const { money } = useMoney()
  const open = useDebtModal()
  const removeWorkSession = useStore((s) => s.removeWorkSession)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <ActivityIcon size={20} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold leading-none">Mi trabajo</h2>
            <p className="text-xs text-muted">{workLabel} y productividad para pagar deudas</p>
          </div>
        </div>
        <button onClick={() => open({ type: 'work' })} className="btn-primary">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted"><Gauge size={15} /><span className="text-xs">Neto por hora</span></div>
          <p className="tnum mt-1 font-display text-xl font-bold text-income">{money(uber.netPerHour)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted"><Clock size={15} /><span className="text-xs">Horas totales</span></div>
          <p className="tnum mt-1 font-display text-xl font-bold text-content">{uber.totalHours.toFixed(0)}h</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted"><ActivityIcon size={15} /><span className="text-xs">Ganancia neta</span></div>
          <p className="tnum mt-1 font-display text-xl font-bold text-content">{money(uber.netTotal, { compact: true })}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-muted"><Coins size={15} /><span className="text-xs">{costLabel} total</span></div>
          <p className="tnum mt-1 font-display text-xl font-bold text-expense">{money(uber.totalCost, { compact: true })}</p>
        </div>
      </div>

      {/* Daily income target */}
      <DailyTargetCard />

      {/* Hours to pay each debt */}
      <Card>
        <CardHeader title="¿Cuántas horas para pagar cada deuda?" subtitle={uber.netPerHour > 0 ? `A ${money(uber.netPerHour)}/hora neto` : `Registra ${workLabel.toLowerCase()} para calcularlo`} />
        {uber.netPerHour <= 0 ? (
          <EmptyState icon={<Clock size={22} />} title="Sin datos de trabajo" description="Registra al menos una jornada para calcular cuántas horas necesitas." />
        ) : active.length === 0 ? (
          <p className="py-3 text-sm text-muted">No tienes deudas activas. ¡Bien!</p>
        ) : (
          <div className="space-y-3">
            {active.map((d) => {
              const hours = Math.ceil(hoursToPay(d.balance, uber.netPerHour))
              return (
                <div key={d.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{d.name}</p>
                    <p className="text-xs text-muted">Faltan {money(d.balance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tnum font-display text-lg font-bold text-primary">{hours}h</p>
                    <p className="text-[11px] text-muted">≈ {Math.ceil(hours / 8)} días de 8h</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Sessions history */}
      <Card className="!p-2">
        {workSessions.length === 0 ? (
          <EmptyState icon={<ActivityIcon size={22} />} title={`Sin ${workLabel.toLowerCase()} registradas`} description={`Registra horas, ${incomeLabel.toLowerCase()} y ${costLabel.toLowerCase()} para conocer tu valor por hora.`} />
        ) : (
          <div className="divide-y divide-border/60">
            {workSessions.map((w) => {
              const net = w.earnings - w.fuel_cost
              return (
                <div key={w.id} className="flex items-center gap-3 px-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-content">
                      {fmtShort(w.date)} · {w.hours}h
                    </p>
                    <p className="text-xs text-muted">
                      Neto {money(net)} · {money(net / (w.hours || 1))}/h
                    </p>
                  </div>
                  <button
                    onClick={() => removeWorkSession(w.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:text-expense"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
