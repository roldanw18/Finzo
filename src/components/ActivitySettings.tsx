import { useState } from 'react'
import { Briefcase, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { friendlyError } from '@/lib/errors'
import { getIcon } from '@/lib/icons'
import { ACTIVITY_PRESETS, activityPreset, type ActivityType } from '@/config/activities'
import { cn } from '@/lib/utils'
import type { Service } from '@/types'

export function ActivitySettings() {
  const saveProfile = useStore((s) => s.saveProfile)
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const profile = useStore((s) => s.profile)
  const { activityType, incomeLabel, costLabel, costFactor } = useActivity()
  const { currency } = useMoney()
  const { t } = useI18n()

  const [type, setType] = useState<ActivityType>((activityType ?? 'other') as ActivityType)
  const [income, setIncome] = useState(incomeLabel)
  const [cost, setCost] = useState(costLabel)
  const [factor, setFactor] = useState(costFactor)
  const [services, setServices] = useState<Service[]>(profile?.services ?? [])
  const [saving, setSaving] = useState(false)

  function pick(t: ActivityType) {
    const p = activityPreset(t)
    setType(t)
    setIncome(p.incomeLabel)
    setCost(p.costLabel)
    setFactor(p.costFactor)
    // Prefill this occupation's suggested services, but only if the menu is
    // empty — never clobber services the user already set up.
    setServices((prev) =>
      prev.length > 0 ? prev : (p.services ?? []).map((s) => ({ id: crypto.randomUUID(), ...s })),
    )
  }

  function updateSvc(id: string, patch: Partial<Service>) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function addSvc() {
    setServices((prev) => [...prev, { id: crypto.randomUUID(), name: '', price: 0 }])
  }
  function removeSvc(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  async function save(addCats: boolean) {
    setSaving(true)
    const cleanServices = services.map((s) => ({ ...s, name: s.name.trim() })).filter((s) => s.name)
    try {
      await saveProfile({
        activity_type: type,
        income_label: income.trim() || 'Ingreso',
        cost_label: cost.trim() || 'Costos',
        cost_factor: factor,
        services: cleanServices,
      })
      setServices(cleanServices)
      if (addCats) {
        const existing = new Set(categories.map((c) => c.name.toLowerCase()))
        let added = 0
        for (const c of activityPreset(type).categories) {
          if (existing.has(c.name.toLowerCase())) continue
          await addCategory({ name: c.name, color: c.color, icon: c.icon })
          added++
        }
        toast.success(
          added > 0 ? `${added} ${t('categorías agregadas')}` : t('Ya tenías todas las categorías'),
        )
      } else {
        toast.success(t('Perfil de actividad actualizado'))
      }
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={t('Mi actividad')}
        subtitle={t('Adapta la app a lo que haces')}
        icon={<Briefcase size={18} className="text-primary" />}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIVITY_PRESETS.map((a) => {
          const Icon = getIcon(a.icon)
          return (
            <button
              key={a.value}
              onClick={() => pick(a.value)}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition',
                type === a.value
                  ? 'border-primary/60 bg-primary/10 text-content'
                  : 'border-border text-muted hover:bg-surface-2',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{t(a.label)}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t('Cómo llamas a tus ingresos')}</label>
          <input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder={t('Ej. Servicio, Venta, Viaje')}
            className="input"
          />
        </div>
        <div>
          <label className="label">{t('Tu costo variable')}</label>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder={t('Ej. Insumos, Gasolina')}
            className="input"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">
          {t('¿Cuánto de lo que ganas se va en {c}?').replace(
            '{c}',
            cost.toLowerCase() || t('costos'),
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { f: 1.05, l: '5%' },
            { f: 1.15, l: '15%' },
            { f: 1.2, l: '20%' },
            { f: 1.3, l: '30%' },
            { f: 1.5, l: '50%' },
          ].map((o) => (
            <button
              key={o.f}
              onClick={() => setFactor(o.f)}
              className={cn(
                'chip border px-3 py-1.5 text-xs font-medium transition',
                factor === o.f
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border bg-surface-2 text-content hover:bg-surface-3',
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {t(
            'Se usa en la meta diaria: multiplica tus obligaciones ×{f} para que el dinero te quede libre después de pagar {c}.',
          )
            .replace('{f}', String(factor))
            .replace('{c}', cost.toLowerCase() || t('costos'))}
        </p>
      </div>

      {/* Quick services menu — tied to the activity */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <label className="label">{t('Tu menú de servicios (opcional)')}</label>
        <p className="mb-3 text-xs text-muted">
          {t(
            'Para cobrar rápido lo que vendes (p. ej. Corte, Cejas, Snack). Aparecen al registrar un ingreso. Déjalo vacío si no aplica.',
          )}
        </p>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                value={s.name}
                onChange={(e) => updateSvc(s.id, { name: e.target.value })}
                placeholder={t('Nombre')}
                className="input min-w-0 flex-1"
              />
              <div className="w-32 shrink-0">
                <AmountInput
                  value={s.price}
                  onChange={(v) => updateSvc(s.id, { price: v })}
                  currency={currency}
                  size="md"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSvc(s.id)}
                aria-label={t('Eliminar')}
                className="btn-danger shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSvc} className="btn-outline mt-2">
          <Plus size={16} /> {t('Agregar servicio')}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => save(false)} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {t('Guardar')}
        </button>
        <button onClick={() => save(true)} disabled={saving} className="btn-outline">
          {t('Guardar y agregar categorías del oficio')}
        </button>
      </div>
    </Card>
  )
}
