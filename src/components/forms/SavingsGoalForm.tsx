import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { getIcon, CATEGORY_COLORS } from '@/lib/icons'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'
import type { SavingsGoal } from '@/types'

const GOAL_ICONS = [
  'PiggyBank',
  'ShieldCheck',
  'Plane',
  'Home',
  'Car',
  'Smartphone',
  'GraduationCap',
  'Gift',
  'HeartPulse',
  'Briefcase',
  'Dumbbell',
  'Baby',
]

interface Props {
  editing?: SavingsGoal
  onDone: () => void
}

export function SavingsGoalForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const addSavingsGoal = useStore((s) => s.addSavingsGoal)
  const editSavingsGoal = useStore((s) => s.editSavingsGoal)
  const removeSavingsGoal = useStore((s) => s.removeSavingsGoal)

  const [name, setName] = useState(editing?.name ?? '')
  const [target, setTarget] = useState(editing?.target_amount ?? 0)
  const [saved, setSaved] = useState(editing?.saved_amount ?? 0)
  const [targetDate, setTargetDate] = useState(editing?.target_date ?? '')
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS[2])
  const [icon, setIcon] = useState(editing?.icon ?? 'PiggyBank')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Ponle nombre a la meta')
    if (target <= 0) return toast.error('Define un monto objetivo')
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        target_amount: target,
        saved_amount: saved,
        target_date: targetDate || null,
        color,
        icon,
      }
      if (editing) {
        await editSavingsGoal(editing.id, payload)
        toast.success('Meta actualizada')
      } else {
        await addSavingsGoal(payload)
        toast.success('Meta de ahorro creada ✓')
      }
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const Preview = getIcon(icon)

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Live preview */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3.5">
        <span
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: `${color}22`, color }}
        >
          <Preview size={24} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-content">{name || 'Nombre de la meta'}</p>
          <p className="text-xs text-muted">Meta de ahorro</p>
        </div>
      </div>

      <div>
        <label className="label">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Fondo de emergencia"
          className="input"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Meta a alcanzar</label>
        <AmountInput value={target} onChange={setTarget} currency={currency} size="md" />
      </div>

      <div>
        <label className="label">Ya ahorrado</label>
        <AmountInput value={saved} onChange={setSaved} currency={currency} size="md" />
      </div>

      <div>
        <label className="label">Fecha meta (opcional)</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn('h-8 w-8 rounded-full transition', color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : '')}
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label">Ícono</label>
        <div className="grid grid-cols-6 gap-2">
          {GOAL_ICONS.map((n) => {
            const Icon = getIcon(n)
            const active = n === icon
            return (
              <button
                key={n}
                type="button"
                onClick={() => setIcon(n)}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg border transition',
                  active
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-transparent text-muted hover:bg-surface-3',
                )}
              >
                <Icon size={18} strokeWidth={2.2} style={active ? { color } : undefined} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm('¿Eliminar esta meta de ahorro?')) return
              await removeSavingsGoal(editing.id)
              toast.success('Meta eliminada')
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
            'Guardar cambios'
          ) : (
            'Crear meta'
          )}
        </button>
      </div>
    </form>
  )
}
