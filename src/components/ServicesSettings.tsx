import { useState } from 'react'
import { Plus, Trash2, Check, Loader2, Store } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { friendlyError } from '@/lib/errors'
import type { Service } from '@/types'

/** Editor for the quick-service menu used to log income with one tap. */
export function ServicesSettings() {
  const profile = useStore((s) => s.profile)
  const saveProfile = useStore((s) => s.saveProfile)
  const { currency } = useMoney()
  const { t } = useI18n()
  const [list, setList] = useState<Service[]>(profile?.services ?? [])
  const [saving, setSaving] = useState(false)

  function update(id: string, patch: Partial<Service>) {
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function add() {
    setList((prev) => [...prev, { id: crypto.randomUUID(), name: '', price: 0 }])
  }
  function remove(id: string) {
    setList((prev) => prev.filter((s) => s.id !== id))
  }
  async function save() {
    const clean = list.map((s) => ({ ...s, name: s.name.trim() })).filter((s) => s.name)
    setSaving(true)
    try {
      await saveProfile({ services: clean })
      setList(clean)
      toast.success(t('Servicios guardados'))
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={t('Servicios rápidos')}
        subtitle={t('Tu menú para registrar ingresos de un toque')}
        icon={<Store size={18} className="text-primary" />}
      />
      <div className="space-y-2">
        {list.length === 0 && (
          <p className="text-sm text-muted">
            {t('Agrega tus servicios o productos con su precio (p. ej. Corte, Cejas, Snack).')}
          </p>
        )}
        {list.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <input
              value={s.name}
              onChange={(e) => update(s.id, { name: e.target.value })}
              placeholder={t('Nombre')}
              className="input min-w-0 flex-1"
            />
            <div className="w-36 shrink-0">
              <AmountInput
                value={s.price}
                onChange={(v) => update(s.id, { price: v })}
                currency={currency}
                size="md"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label={t('Eliminar')}
              className="btn-danger shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={add} className="btn-outline">
          <Plus size={16} /> {t('Agregar servicio')}
        </button>
        <button type="button" onClick={save} disabled={saving} className="btn-primary">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} /> {t('Guardar')}
            </>
          )}
        </button>
      </div>
    </Card>
  )
}
