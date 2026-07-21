import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { getIcon, ICON_NAMES, CATEGORY_COLORS } from '@/lib/icons'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface Props {
  editing?: Category
  onDone: () => void
}

export function CategoryForm({ editing, onDone }: Props) {
  const addCategory = useStore((s) => s.addCategory)
  const editCategory = useStore((s) => s.editCategory)
  const removeCategory = useStore((s) => s.removeCategory)
  const expenses = useStore((s) => s.expenses)

  const [name, setName] = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon] = useState(editing?.icon ?? 'Tag')
  const [saving, setSaving] = useState(false)

  const usageCount = editing
    ? expenses.filter((e) => e.category_id === editing.id).length
    : 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Ingresa un nombre')
    setSaving(true)
    try {
      if (editing) {
        await editCategory(editing.id, { name: name.trim(), color, icon })
        toast.success('Categoría actualizada')
      } else {
        await addCategory({ name: name.trim(), color, icon })
        toast.success('Categoría creada ✓')
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
    if (
      usageCount > 0 &&
      !confirm(
        `Esta categoría tiene ${usageCount} gasto(s). Se quedarán como "Sin categoría". ¿Eliminar?`,
      )
    )
      return
    setSaving(true)
    try {
      await removeCategory(editing.id)
      toast.success('Categoría eliminada')
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
          <p className="truncate font-medium text-content">{name || 'Nombre de categoría'}</p>
          <p className="text-xs text-muted">Vista previa</p>
        </div>
      </div>

      <div>
        <label className="label">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Transporte"
          className="input"
          autoFocus
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
              className={cn(
                'h-8 w-8 rounded-full transition',
                color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : '',
              )}
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="label">Ícono</label>
        <div className="grid max-h-40 grid-cols-7 gap-2 overflow-y-auto rounded-xl border border-border bg-surface-2/50 p-2 sm:grid-cols-9">
          {ICON_NAMES.map((n) => {
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
                <CategoryIconInline name={n} active={active} color={color} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        {editing && !editing.is_default && (
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
            'Crear categoría'
          )}
        </button>
      </div>
      {editing?.is_default && (
        <p className="text-center text-xs text-subtle">
          Las categorías predeterminadas no se pueden eliminar, pero sí editar.
        </p>
      )}
    </form>
  )
}

function CategoryIconInline({
  name,
  color,
  active,
}: {
  name: string
  color: string
  active: boolean
}) {
  const Icon = getIcon(name)
  return <Icon size={18} strokeWidth={2.2} style={active ? { color } : undefined} />
}
