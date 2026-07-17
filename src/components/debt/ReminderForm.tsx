import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { Segmented } from '@/components/ui/Segmented'
import { REMINDER_CATEGORIES, type Reminder, type ReminderCategory } from '@/types'

interface Props {
  editing?: Reminder
  onDone: () => void
}

export function ReminderForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const addReminder = useStore((s) => s.addReminder)
  const editReminder = useStore((s) => s.editReminder)
  const removeReminder = useStore((s) => s.removeReminder)

  const [title, setTitle] = useState(editing?.title ?? '')
  const [category, setCategory] = useState<ReminderCategory>(editing?.category ?? 'servicio')
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [recurring, setRecurring] = useState<'none' | 'monthly' | 'yearly'>(
    editing?.recurring ?? 'none',
  )
  const [note, setNote] = useState(editing?.note ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return toast.error('Ponle un título')
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        category,
        date,
        amount: amount || null,
        recurring,
        note,
      }
      if (editing) {
        await editReminder(editing.id, payload)
        toast.success('Recordatorio actualizado')
      } else {
        await addReminder(payload)
        toast.success('Recordatorio creado ✓')
      }
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. SOAT del carro"
          className="input"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ReminderCategory)}
          className="input"
        >
          {REMINDER_CATEGORIES.filter((c) => c.value !== 'corte' && c.value !== 'pago').map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Repetir</label>
          <Segmented
            value={recurring}
            onChange={setRecurring}
            size="sm"
            options={[
              { value: 'none', label: 'No' },
              { value: 'monthly', label: 'Mensual' },
              { value: 'yearly', label: 'Anual' },
            ]}
          />
        </div>
      </div>

      <div>
        <label className="label">Monto estimado (opcional)</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} size="md" />
      </div>

      <div>
        <label className="label">Nota</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </div>

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={async () => {
              await removeReminder(editing.id)
              toast.success('Eliminado')
              onDone()
            }}
            className="btn-danger"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
