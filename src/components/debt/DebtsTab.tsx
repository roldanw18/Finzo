import { Plus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { DebtCard } from './DebtCard'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'
import { useDebtModal } from './modalContext'

export function DebtsTab() {
  const { debts } = useDebt()
  const { money } = useMoney()
  const open = useDebtModal()

  const active = debts.filter((d) => d.status === 'active')
  const paid = debts.filter((d) => d.status === 'paid')
  const maxBalance = Math.max(...active.map((d) => d.balance), 1)

  if (debts.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Aún no registras deudas"
          description="Agrega tus tarjetas, préstamos y créditos para empezar el plan."
          action={
            <button onClick={() => open({ type: 'debt' })} className="btn-primary mt-1">
              <Plus size={16} /> Agregar deuda
            </button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((d) => (
          <DebtCard
            key={d.id}
            debt={d}
            onEdit={() => open({ type: 'debt', editing: d })}
            onPay={() => open({ type: 'payment', debtId: d.id })}
          />
        ))}
      </div>

      {active.length > 1 && (
        <Card>
          <CardHeader title="Comparación entre deudas" subtitle="Saldo actual" />
          <div className="space-y-3">
            {active.map((d) => (
              <div key={d.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-content">{d.name}</span>
                  <span className="tnum font-semibold text-content">{money(d.balance, { compact: true })}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-expense"
                    style={{ width: `${(d.balance / maxBalance) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {paid.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-semibold text-muted">Pagadas ✓</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {paid.map((d) => (
              <DebtCard key={d.id} debt={d} onEdit={() => open({ type: 'debt', editing: d })} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
