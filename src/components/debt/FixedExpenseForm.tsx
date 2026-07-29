import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import type { FixedExpense } from '@/types'

interface Props {
  editing?: FixedExpense
  onDone: () => void
}

export function FixedExpenseForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const { t } = useI18n()
  const categories = useStore((s) => s.categories)
  const addFixedExpense = useStore((s) => s.addFixedExpense)
  const editFixedExpense = useStore((s) => s.editFixedExpense)
  const removeFixedExpense = useStore((s) => s.removeFixedExpense)

  const [name, setName] = useState(editing?.name ?? '')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [dueDay, setDueDay] = useState(editing?.due_day?.toString() ?? '')
  const [countInTarget, setCountInTarget] = useState(editing?.count_in_target !== false)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error(t('Ponle un nombre'))
    if (amount <= 0) return toast.error(t('Ingresa el monto mensual'))
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        amount,
        category_id: categoryId || null,
        due_day: dueDay ? Number(dueDay) : null,
        active: true,
        count_in_target: countInTarget,
      }
      if (editing) {
        await editFixedExpense(editing.id, payload)
        toast.success(t('Gasto fijo actualizado'))
      } else {
        await addFixedExpense(payload)
        toast.success(t('Gasto fijo agregado ✓'))
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
        <label className="label">{t('Nombre')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('Ej. Arriendo, Internet, Plan celular…')}
          className="input"
          autoFocus
        />
      </div>

      <div>
        <label className="label">{t('Monto mensual')}</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} size="md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t('Día de pago (opcional)')}</label>
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
        <div>
          <label className="label">{t('Categoría (opcional)')}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">{t('Sin categoría')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start justify-between gap-3 rounded-xl border border-income/25 bg-income/[0.06] p-3">
        <span>
          <span className="block text-sm font-medium text-content">
            {t('Contar en la meta diaria de ingresos')}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {t('Si la desmarcas, sigue siendo un gasto fijo pero no suma a lo que debes producir cada día.')}
          </span>
        </span>
        <input
          type="checkbox"
          checked={countInTarget}
          onChange={(e) => setCountInTarget(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-income"
        />
      </label>

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={async () => {
              await removeFixedExpense(editing.id)
              toast.success(t('Eliminado'))
              onDone()
            }}
            className="btn-danger"
            disabled={saving}
          >
            <Trash2 size={16} />
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            t('Guardar cambios')
          ) : (
            t('Agregar gasto fijo')
          )}
        </button>
      </div>
    </form>
  )
}
