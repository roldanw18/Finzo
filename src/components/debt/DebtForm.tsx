import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'
import { DEBT_TYPES, type Debt, type DebtType } from '@/types'

interface Props {
  editing?: Debt
  onDone: () => void
}

export function DebtForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const addDebt = useStore((s) => s.addDebt)
  const editDebt = useStore((s) => s.editDebt)
  const removeDebt = useStore((s) => s.removeDebt)

  const [name, setName] = useState(editing?.name ?? '')
  const [creditor, setCreditor] = useState(editing?.creditor ?? '')
  const [balance, setBalance] = useState(editing?.balance ?? 0)
  const [noInterest, setNoInterest] = useState(
    editing ? !editing.interest_rate : false,
  )
  const [rate, setRate] = useState(editing?.interest_rate ?? 0)
  const [type, setType] = useState<DebtType>(editing?.type ?? 'credit_card')
  const [minPayment, setMinPayment] = useState(editing?.min_payment ?? 0)
  const [targetPayment, setTargetPayment] = useState(editing?.target_payment ?? 0)
  const [cutDay, setCutDay] = useState<string>(editing?.cut_day?.toString() ?? '')
  const [dueDay, setDueDay] = useState<string>(editing?.due_day?.toString() ?? '')
  const [paid, setPaid] = useState(editing?.status === 'paid')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Ponle un nombre a la deuda')
    if (balance <= 0 && !paid) return toast.error('Ingresa el saldo actual')
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        creditor: creditor.trim(),
        balance,
        interest_rate: noInterest ? null : rate,
        type,
        min_payment: minPayment,
        target_payment: targetPayment || minPayment,
        cut_day: cutDay ? Number(cutDay) : null,
        due_day: dueDay ? Number(dueDay) : null,
        status: (paid ? 'paid' : 'active') as 'paid' | 'active',
      }
      if (editing) {
        await editDebt(editing.id, payload)
        toast.success('Deuda actualizada')
      } else {
        await addDebt({ ...payload, initial_balance: balance })
        toast.success('Deuda agregada ✓')
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
    if (!confirm('¿Eliminar esta deuda y sus pagos registrados?')) return
    setSaving(true)
    try {
      await removeDebt(editing.id)
      toast.success('Deuda eliminada')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. NU, Bancolombia…"
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Acreedor</label>
          <input
            value={creditor}
            onChange={(e) => setCreditor(e.target.value)}
            placeholder="Ej. Nu Bank"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Saldo actual</label>
        <AmountInput value={balance} onChange={setBalance} currency={currency} size="md" />
      </div>

      <div>
        <label className="label">Tipo de deuda</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEBT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                type === t.value
                  ? 'border-primary/60 bg-primary/10 text-content'
                  : 'border-border text-muted hover:bg-surface-2',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interest */}
      <div className="rounded-xl border border-border bg-surface-2/50 p-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-content">Sin intereses</span>
          <input
            type="checkbox"
            checked={noInterest}
            onChange={(e) => setNoInterest(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>
        {!noInterest && (
          <div className="mt-3">
            <label className="label">Tasa de interés anual (%)</label>
            <input
              type="number"
              step="0.1"
              value={rate || ''}
              onChange={(e) => setRate(Number(e.target.value))}
              placeholder="Ej. 32"
              className="input"
            />
          </div>
        )}
        {noInterest && (
          <p className="mt-2 text-xs text-info">
            Esta deuda no genera intereses — no es prioridad según Avalancha.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Pago mínimo</label>
          <AmountInput value={minPayment} onChange={setMinPayment} currency={currency} size="md" />
        </div>
        <div>
          <label className="label">Pago objetivo</label>
          <AmountInput
            value={targetPayment}
            onChange={setTargetPayment}
            currency={currency}
            size="md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Día de corte</label>
          <input
            type="number"
            min={1}
            max={31}
            value={cutDay}
            onChange={(e) => setCutDay(e.target.value)}
            placeholder="1-31"
            className="input"
          />
        </div>
        <div>
          <label className="label">Día de pago</label>
          <input
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="1-31"
            className="input"
          />
        </div>
      </div>

      {editing && (
        <label className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 p-3">
          <span className="text-sm font-medium text-content">Marcar como pagada</span>
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-5 w-5 accent-income"
          />
        </label>
      )}

      <div className="flex gap-3 pt-1">
        {editing && (
          <button type="button" onClick={onDelete} className="btn-danger" disabled={saving}>
            <Trash2 size={16} />
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            'Guardar cambios'
          ) : (
            'Agregar deuda'
          )}
        </button>
      </div>
    </form>
  )
}
