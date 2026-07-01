import { useState } from 'react'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from '@/types'

interface Props {
  editing?: Expense
  onDone: () => void
}

export function ExpenseForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const categories = useStore((s) => s.categories.filter((c) => c.type === 'expense'))
  const addExpense = useStore((s) => s.addExpense)
  const editExpense = useStore((s) => s.editExpense)
  const removeExpense = useStore((s) => s.removeExpense)
  const openCategory = useUI((s) => s.openCategory)

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState<string | null>(
    editing?.category_id ?? categories[0]?.id ?? null,
  )
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [description, setDescription] = useState(editing?.description ?? '')
  const [method, setMethod] = useState<PaymentMethod>(editing?.payment_method ?? 'cash')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0) return toast.error('Ingresa un monto válido')
    if (!categoryId) return toast.error('Selecciona una categoría')
    setSaving(true)
    try {
      const payload = {
        amount,
        category_id: categoryId,
        date,
        description,
        payment_method: method,
        notes,
      }
      if (editing) {
        await editExpense(editing.id, payload)
        toast.success('Gasto actualizado')
      } else {
        await addExpense(payload)
        toast.success('Gasto registrado ✓')
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
      await removeExpense(editing.id)
      toast.success('Gasto eliminado')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label">Monto</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0">Categoría</label>
          <button
            type="button"
            onClick={() => openCategory()}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus size={13} /> Nueva
          </button>
        </div>
        <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-border bg-surface-2/50 p-2 sm:grid-cols-4">
          {categories.map((c) => {
            const active = c.id === categoryId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition',
                  active
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-transparent hover:bg-surface-3',
                )}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={16} />
                <span className="line-clamp-1 text-[11px] font-medium leading-tight text-muted">
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
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
          <label className="label">Método de pago</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="input"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <input
          type="text"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Tanqueo estación Terpel"
          className="input"
        />
      </div>

      <div>
        <label className="label">Observaciones (opcional)</label>
        <textarea
          value={notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas adicionales"
          className="input resize-none"
        />
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
          className="btn flex-1 bg-expense text-white hover:brightness-105"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            'Guardar cambios'
          ) : (
            'Registrar gasto'
          )}
        </button>
      </div>
    </form>
  )
}
