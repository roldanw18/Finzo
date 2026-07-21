import { useMemo, useState } from 'react'
import { Loader2, Trash2, Target } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/store/useStore'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { nextRecommendedDebt } from '@/lib/debt'
import type { Income } from '@/types'

interface Props {
  editing?: Income
  onDone: () => void
}

export function IncomeForm({ editing, onDone }: Props) {
  const { currency, money } = useMoney()
  const { incomeLabel, icon } = useActivity()
  const ActivityIcon = getIcon(icon)
  const addIncome = useStore((s) => s.addIncome)
  const editIncome = useStore((s) => s.editIncome)
  const removeIncome = useStore((s) => s.removeIncome)
  const addPayment = useStore((s) => s.addPayment)
  const debts = useStore((s) => s.debts)

  const activeDebts = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])
  const recommended = useMemo(() => nextRecommendedDebt(debts).debt, [debts])

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [note, setNote] = useState(editing?.note ?? '')
  const [allocate, setAllocate] = useState(false)
  const [allocAmount, setAllocAmount] = useState(0)
  const [allocDebtId, setAllocDebtId] = useState(recommended?.id ?? activeDebts[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const showAllocation = !editing && activeDebts.length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await editIncome(editing.id, { amount, date, note })
        toast.success('Ingreso actualizado')
      } else {
        await addIncome({ amount, date, note })
        if (allocate && allocAmount > 0 && allocDebtId) {
          await addPayment({ debt_id: allocDebtId, amount: allocAmount, date, note: 'Abono desde ingreso' })
          toast.success(`Ingreso + abono de ${money(allocAmount)} ✓`)
        } else {
          toast.success('Ingreso registrado ✓')
        }
      }
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!editing) return
    setSaving(true)
    try {
      await removeIncome(editing.id)
      toast.success('Ingreso eliminado')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-income/10 p-3.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-income/15 text-income">
          <ActivityIcon size={22} />
        </span>
        <div>
          <p className="font-medium text-content">Registrar {incomeLabel.toLowerCase()}</p>
          <p className="text-xs text-muted">Registro rápido en menos de 10 segundos</p>
        </div>
      </div>

      <div>
        <label className="label">Monto</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input
            type="text"
            value={note ?? ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. jornada de la tarde"
            className="input"
          />
        </div>
      </div>

      {showAllocation && (
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-content">
              <Target size={16} className="text-primary" />
              Destinar parte a mis deudas
            </span>
            <input
              type="checkbox"
              checked={allocate}
              onChange={(e) => {
                setAllocate(e.target.checked)
                if (e.target.checked && allocAmount === 0) {
                  setAllocAmount(Math.round(amount * 0.3))
                }
              }}
              className="h-5 w-5 accent-primary"
            />
          </label>
          {allocate && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">¿Cuánto abonar?</label>
                <AmountInput
                  value={allocAmount}
                  onChange={setAllocAmount}
                  currency={currency}
                  size="md"
                />
              </div>
              <div>
                <label className="label">A la deuda</label>
                <select
                  value={allocDebtId}
                  onChange={(e) => setAllocDebtId(e.target.value)}
                  className="input"
                >
                  {activeDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {recommended?.id === d.id ? ' (recomendada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {editing && (
          <button type="button" onClick={onDelete} className="btn-danger" disabled={saving}>
            <Trash2 size={16} />
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn flex-1 bg-income text-white hover:brightness-105"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            'Guardar cambios'
          ) : (
            'Registrar ingreso'
          )}
        </button>
      </div>
    </form>
  )
}
