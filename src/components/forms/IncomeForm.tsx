import { useState } from 'react'
import { Car, Loader2, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import type { Income } from '@/types'

interface Props {
  editing?: Income
  onDone: () => void
}

export function IncomeForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const addIncome = useStore((s) => s.addIncome)
  const editIncome = useStore((s) => s.editIncome)
  const removeIncome = useStore((s) => s.removeIncome)

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [note, setNote] = useState(editing?.note ?? '')
  const [saving, setSaving] = useState(false)

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
        toast.success('Ingreso registrado ✓')
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
          <Car size={22} />
        </span>
        <div>
          <p className="font-medium text-content">Ingreso de Uber</p>
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
            placeholder="Ej. turno noche"
            className="input"
          />
        </div>
      </div>

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
