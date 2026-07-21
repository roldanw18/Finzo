import { useState } from 'react'
import { Briefcase, Check, Loader2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { useActivity } from '@/hooks/useActivity'
import { toast } from '@/store/toast'
import { getIcon } from '@/lib/icons'
import { ACTIVITY_PRESETS, activityPreset, type ActivityType } from '@/config/activities'
import { cn } from '@/lib/utils'

export function ActivitySettings() {
  const saveProfile = useStore((s) => s.saveProfile)
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const { activityType, incomeLabel, costLabel, costFactor } = useActivity()

  const [type, setType] = useState<ActivityType>((activityType ?? 'other') as ActivityType)
  const [income, setIncome] = useState(incomeLabel)
  const [cost, setCost] = useState(costLabel)
  const [factor, setFactor] = useState(costFactor)
  const [saving, setSaving] = useState(false)

  function pick(t: ActivityType) {
    const p = activityPreset(t)
    setType(t)
    setIncome(p.incomeLabel)
    setCost(p.costLabel)
    setFactor(p.costFactor)
  }

  async function save(addCats: boolean) {
    setSaving(true)
    try {
      await saveProfile({
        activity_type: type,
        income_label: income.trim() || 'Ingreso',
        cost_label: cost.trim() || 'Costos',
        cost_factor: factor,
      })
      if (addCats) {
        const existing = new Set(categories.map((c) => c.name.toLowerCase()))
        let added = 0
        for (const c of activityPreset(type).categories) {
          if (existing.has(c.name.toLowerCase())) continue
          await addCategory({ name: c.name, color: c.color, icon: c.icon })
          added++
        }
        toast.success(added > 0 ? `${added} categorías agregadas` : 'Ya tenías todas las categorías')
      } else {
        toast.success('Perfil de actividad actualizado')
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Mi actividad"
        subtitle="Adapta la app a lo que haces"
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
              <span className="truncate">{a.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Cómo llamas a tus ingresos</label>
          <input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Ej. Servicio, Venta, Viaje"
            className="input"
          />
        </div>
        <div>
          <label className="label">Tu costo variable</label>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Ej. Insumos, Gasolina"
            className="input"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">
          ¿Cuánto de lo que ganas se va en {cost.toLowerCase() || 'costos'}?
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
          Se usa en la meta diaria: multiplica tus obligaciones ×{factor} para que el dinero
          te quede libre después de pagar {cost.toLowerCase() || 'costos'}.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => save(false)} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Guardar
        </button>
        <button onClick={() => save(true)} disabled={saving} className="btn-outline">
          Guardar y agregar categorías del oficio
        </button>
      </div>
    </Card>
  )
}
