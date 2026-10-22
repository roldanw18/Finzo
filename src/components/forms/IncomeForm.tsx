import { useMemo, useState } from 'react'
import { Loader2, Trash2, Target, X } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { AmountPresets } from '@/components/ui/AmountPresets'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/store/useStore'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { friendlyError } from '@/lib/errors'
import { todayISO } from '@/lib/dates'
import { nextRecommendedDebt } from '@/lib/debt'
import type { Income, IncomeItem, Service } from '@/types'

interface Props {
  editing?: Income
  onDone: () => void
}

export function IncomeForm({ editing, onDone }: Props) {
  const { currency, money } = useMoney()
  const { t } = useI18n()
  const { incomeLabel, icon } = useActivity()
  const ActivityIcon = getIcon(icon)
  const addIncome = useStore((s) => s.addIncome)
  const editIncome = useStore((s) => s.editIncome)
  const removeIncome = useStore((s) => s.removeIncome)
  const addPayment = useStore((s) => s.addPayment)
  const debts = useStore((s) => s.debts)
  const services = useStore((s) => s.profile?.services ?? [])

  const activeDebts = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])
  const recommended = useMemo(() => nextRecommendedDebt(debts).debt, [debts])

  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [items, setItems] = useState<IncomeItem[]>(editing?.items ?? [])
  const [date, setDate] = useState(editing?.date ?? todayISO())
  const [note, setNote] = useState(editing?.note ?? '')

  function addService(s: Service) {
    setItems((prev) => [...prev, { name: s.name, price: s.price }])
    setAmount((a) => a + s.price)
  }
  function removeItem(idx: number) {
    setItems((prev) => {
      const removed = prev[idx]
      if (removed) setAmount((a) => Math.max(0, a - removed.price))
      return prev.filter((_, i) => i !== idx)
    })
  }
  const [allocate, setAllocate] = useState(false)
  const [allocAmount, setAllocAmount] = useState(0)
  const [allocDebtId, setAllocDebtId] = useState(recommended?.id ?? activeDebts[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const showAllocation = !editing && activeDebts.length > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0) {
      toast.error(t('Ingresa un monto válido'))
      return
    }
    setSaving(true)
    const composedNote = note.trim() || (items.length ? items.map((i) => i.name).join(' + ') : '')
    const itemsPayload = items.length ? items : null
    try {
      if (editing) {
        await editIncome(editing.id, { amount, date, note: composedNote, items: itemsPayload })
        toast.success(t('Ingreso actualizado'))
      } else {
        await addIncome({ amount, date, note: composedNote, items: itemsPayload })
        if (allocate && allocAmount > 0 && allocDebtId) {
          await addPayment({ debt_id: allocDebtId, amount: allocAmount, date, note: t('Abono desde ingreso') })
          toast.success(t('Ingreso + abono de {m} ✓').replace('{m}', money(allocAmount)))
        } else {
          toast.success(t('Ingreso registrado ✓'))
        }
      }
      onDone()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!editing) return
    if (!confirm(t('¿Eliminar este ingreso?'))) return
    setSaving(true)
    try {
      await removeIncome(editing.id)
      toast.success(t('Ingreso eliminado'))
      onDone()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-income/10 p-3.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-income/15 text-income">
          <ActivityIcon size={22} />
        </span>
        <div>
          <p className="font-medium text-content">{t('Registrar {l}').replace('{l}', incomeLabel.toLowerCase())}</p>
          <p className="text-xs text-muted">{t('Registro rápido en menos de 10 segundos')}</p>
        </div>
      </div>

      <div>
        <label className="label">{t('Monto')}</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus />
        <AmountPresets currency={currency} onAdd={(d) => setAmount(amount + d)} />
      </div>

      {services.length > 0 && (
        <div>
          <label className="label">{t('Servicios')}</label>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addService(s)}
                className="chip border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-content transition hover:bg-surface-3 active:scale-95"
              >
                {s.name}
                <span className="ml-1 text-muted">{money(s.price, { compact: true })}</span>
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {items.map((it, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {it.name}
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label={t('Quitar')}
                    className="transition hover:text-expense"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t('Fecha')}</label>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">{t('Nota (opcional)')}</label>
          <input
            type="text"
            value={note ?? ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ej. jornada de la tarde')}
            className="input"
          />
        </div>
      </div>

      {showAllocation && (
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-content">
              <Target size={16} className="text-primary" />
              {t('Destinar parte a mis deudas')}
            </span>
            <input
              type="checkbox"
              checked={allocate}
              onChange={(e) => {
                setAllocate(e.target.checked)
                if (e.target.checked && allocAmount === 0) {
                  setAllocAmount(Math.round(amount * 0.3))
                }
              }}
              className="h-5 w-5 accent-primary"
            />
          </label>
          {allocate && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">{t('¿Cuánto abonar?')}</label>
                <AmountInput
                  value={allocAmount}
                  onChange={setAllocAmount}
                  currency={currency}
                  size="md"
                />
              </div>
              <div>
                <label className="label">{t('A la deuda')}</label>
                <select
                  value={allocDebtId}
                  onChange={(e) => setAllocDebtId(e.target.value)}
                  className="input"
                >
                  {activeDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {recommended?.id === d.id ? t(' (recomendada)') : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {editing && (
          <button
            type="button"
            onClick={onDelete}
            className="btn-danger"
            disabled={saving}
            aria-label={t('Eliminar ingreso')}
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn flex-1 bg-income text-white hover:brightness-105"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            t('Guardar cambios')
          ) : (
            t('Registrar ingreso')
          )}
        </button>
      </div>
    </form>
  )
}
