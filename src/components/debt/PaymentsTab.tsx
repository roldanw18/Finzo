import { useMemo } from 'react'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FlowChart } from '@/components/charts/FlowChart'
import { useStore } from '@/store/useStore'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'
import { useDebtModal } from './modalContext'
import { fmtShort } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function PaymentsTab() {
  const { payments, debts } = useDebt()
  const { money } = useMoney()
  const open = useDebtModal()
  const removePayment = useStore((s) => s.removePayment)

  const debtName = (id: string) => debts.find((d) => d.id === id)?.name ?? 'Deuda'

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of payments) {
      const k = p.date.slice(0, 7)
      map.set(k, (map.get(k) ?? 0) + p.amount)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k, v]) => ({ label: format(parseISO(k + '-01'), 'MMM', { locale: es }), amount: v }))
  }, [payments])

  const total = payments.reduce((a, p) => a + p.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Total abonado</p>
          <p className="tnum font-display text-2xl font-bold text-income">{money(total)}</p>
        </div>
        <button onClick={() => open({ type: 'payment' })} className="btn-primary">
          <Plus size={16} /> Registrar pago
        </button>
      </div>

      {monthly.length > 1 && (
        <Card>
          <CardHeader title="Progreso mensual" subtitle="Abonos por mes" />
          <FlowChart data={monthly} xKey="label" valueKey="amount" height={220} />
        </Card>
      )}

      <Card className="!p-2">
        {payments.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title="Sin pagos registrados"
            description="Cada abono que registres quedará en este historial."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-2 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-income/12 text-income">
                  <Receipt size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{debtName(p.debt_id)}</p>
                  <p className="truncate text-xs text-muted">
                    {fmtShort(p.date)}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-income">+{money(p.amount)}</span>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar este pago? El saldo de la deuda se restaurará.')) {
                      removePayment(p)
                    }
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:text-expense"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
