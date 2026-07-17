import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { Segmented } from '@/components/ui/Segmented'
import { DEBT_TYPES, type DebtGoal, type DebtType, type GoalKind } from '@/types'

interface Props {
  editing?: DebtGoal
  onDone: () => void
}

export function GoalForm({ editing, onDone }: Props) {
  const debts = useStore((s) => s.debts)
  const addGoal = useStore((s) => s.addGoal)
  const editGoal = useStore((s) => s.editGoal)
  const removeGoal = useStore((s) => s.removeGoal)

  const [name, setName] = useState(editing?.name ?? '')
  const [kind, setKind] = useState<GoalKind>(editing?.kind ?? 'debt')
  const [debtType, setDebtType] = useState<DebtType>(editing?.debt_type ?? 'credit_card')
  const [debtId, setDebtId] = useState(editing?.debt_id ?? debts[0]?.id ?? '')
  const [targetDate, setTargetDate] = useState(editing?.target_date ?? '')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Ponle nombre a la meta')
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        kind,
        debt_type: kind === 'type' ? debtType : null,
        debt_id: kind === 'debt' ? debtId : null,
        target_date: targetDate || null,
      }
      if (editing) {
        await editGoal(editing.id, payload)
        toast.success('Meta actualizada')
      } else {
        await addGoal(payload)
        toast.success('Meta creada ✓')
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
        <label className="label">Nombre de la meta</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Salir de NU"
          className="input"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Tipo de meta</label>
        <Segmented
          value={kind}
          onChange={setKind}
          size="sm"
          options={[
            { value: 'debt', label: 'Una deuda' },
            { value: 'type', label: 'Por tipo' },
            { value: 'all', label: 'Todas' },
          ]}
        />
      </div>

      {kind === 'debt' && (
        <div>
          <label className="label">Deuda</label>
          <select value={debtId} onChange={(e) => setDebtId(e.target.value)} className="input">
            {debts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {kind === 'type' && (
        <div>
          <label className="label">Tipo de deuda</label>
          <select
            value={debtType}
            onChange={(e) => setDebtType(e.target.value as DebtType)}
            className="input"
          >
            {DEBT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Fecha meta (opcional)</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="input"
        />
      </div>

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={async () => {
              await removeGoal(editing.id)
              toast.success('Meta eliminada')
              onDone()
            }}
            className="btn-danger"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Guardar' : 'Crear meta'}
        </button>
      </div>
    </form>
  )
}
