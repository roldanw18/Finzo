import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useActivity } from '@/hooks/useActivity'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { safeDiv } from '@/lib/utils'

export function WorkSessionForm({ onDone }: { onDone: () => void }) {
  const { currency, money } = useMoney()
  const { costLabel, incomeLabel } = useActivity()
  const addWorkSession = useStore((s) => s.addWorkSession)

  const [date, setDate] = useState(todayISO())
  const [hours, setHours] = useState('')
  const [earnings, setEarnings] = useState(0)
  const [fuel, setFuel] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const h = Number(hours) || 0
  const net = earnings - fuel
  const perHour = safeDiv(net, h)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (h <= 0) return toast.error('Ingresa las horas trabajadas')
    if (earnings <= 0) return toast.error('Ingresa lo que ganaste')
    setSaving(true)
    try {
      await addWorkSession({ date, hours: h, earnings, fuel_cost: fuel, note })
      toast.success('Jornada registrada ✓')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <label className="label">Horas trabajadas</label>
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Ej. 8"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">{incomeLabel} del día</label>
        <AmountInput value={earnings} onChange={setEarnings} currency={currency} size="md" />
      </div>
      <div>
        <label className="label">Gasto en {costLabel.toLowerCase()}</label>
        <AmountInput value={fuel} onChange={setFuel} currency={currency} size="md" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-income/10 p-3">
          <p className="text-xs text-muted">Ganancia neta</p>
          <p className="tnum font-display text-lg font-bold text-income">{money(net)}</p>
        </div>
        <div className="rounded-xl bg-info/10 p-3">
          <p className="text-xs text-muted">Valor por hora</p>
          <p className="tnum font-display text-lg font-bold text-info">{money(perHour)}</p>
        </div>
      </div>

      <div>
        <label className="label">Nota (opcional)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. jornada larga, buen día"
          className="input"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 size={16} className="animate-spin" /> : 'Registrar jornada'}
      </button>
    </form>
  )
}
