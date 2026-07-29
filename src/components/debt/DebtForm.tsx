import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'
import { DEBT_TYPES, type Debt, type DebtType } from '@/types'

interface Props {
  editing?: Debt
  onDone: () => void
}

export function DebtForm({ editing, onDone }: Props) {
  const { currency } = useMoney()
  const { t } = useI18n()
  const addDebt = useStore((s) => s.addDebt)
  const editDebt = useStore((s) => s.editDebt)
  const removeDebt = useStore((s) => s.removeDebt)

  const [name, setName] = useState(editing?.name ?? '')
  const [creditor, setCreditor] = useState(editing?.creditor ?? '')
  const [balance, setBalance] = useState(editing?.balance ?? 0)
  const [noInterest, setNoInterest] = useState(
    editing ? !editing.interest_rate : false,
  )
  const [rate, setRate] = useState(editing?.interest_rate ?? 0)
  const [type, setType] = useState<DebtType>(editing?.type ?? 'credit_card')
  const [minPayment, setMinPayment] = useState(editing?.min_payment ?? 0)
  const [targetPayment, setTargetPayment] = useState(editing?.target_payment ?? 0)
  const [cutDay, setCutDay] = useState<string>(editing?.cut_day?.toString() ?? '')
  const [dueDay, setDueDay] = useState<string>(editing?.due_day?.toString() ?? '')
  const [creditLimit, setCreditLimit] = useState(editing?.credit_limit ?? 0)
  const [paid, setPaid] = useState(editing?.status === 'paid')
  const [countInTarget, setCountInTarget] = useState(editing?.count_in_target !== false)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error(t('Ponle un nombre a la deuda'))
    if (balance <= 0 && !paid) return toast.error(t('Ingresa el saldo actual'))
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        creditor: creditor.trim(),
        balance,
        interest_rate: noInterest ? null : rate,
        type,
        min_payment: minPayment,
        target_payment: targetPayment || minPayment,
        cut_day: cutDay ? Number(cutDay) : null,
        due_day: dueDay ? Number(dueDay) : null,
        status: (paid ? 'paid' : 'active') as 'paid' | 'active',
        count_in_target: countInTarget,
        credit_limit: type === 'credit_card' && creditLimit > 0 ? creditLimit : null,
      }
      if (editing) {
        await editDebt(editing.id, payload)
        toast.success(t('Deuda actualizada'))
      } else {
        await addDebt({ ...payload, initial_balance: balance })
        toast.success(t('Deuda agregada ✓'))
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
    if (!confirm(t('¿Eliminar esta deuda y sus pagos registrados?'))) return
    setSaving(true)
    try {
      await removeDebt(editing.id)
      toast.success(t('Deuda eliminada'))
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t('Nombre')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Ej. NU, Bancolombia…')}
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="label">{t('Acreedor')}</label>
          <input
            value={creditor}
            onChange={(e) => setCreditor(e.target.value)}
            placeholder={t('Ej. Nu Bank')}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">{t('Saldo actual')}</label>
        <AmountInput value={balance} onChange={setBalance} currency={currency} size="md" />
      </div>

      <div>
        <label className="label">{t('Tipo de deuda')}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DEBT_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setType(dt.value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                type === dt.value
                  ? 'border-primary/60 bg-primary/10 text-content'
                  : 'border-border text-muted hover:bg-surface-2',
              )}
            >
              {t(dt.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Interest */}
      <div className="rounded-xl border border-border bg-surface-2/50 p-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-content">{t('Sin intereses')}</span>
          <input
            type="checkbox"
            checked={noInterest}
            onChange={(e) => setNoInterest(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>
        {!noInterest && (
          <div className="mt-3">
            <label className="label">{t('Tasa de interés anual (%)')}</label>
            <input
              type="number"
              step="0.1"
              value={rate || ''}
              onChange={(e) => setRate(Number(e.target.value))}
              placeholder={t('Ej. 32')}
              className="input"
            />
          </div>
        )}
        {noInterest && (
          <p className="mt-2 text-xs text-info">
            {t('Esta deuda no genera intereses — no es prioridad según Avalancha.')}
          </p>
        )}
      </div>

      {type === 'credit_card' && (
        <div>
          <label className="label">{t('Cupo total de la tarjeta (opcional)')}</label>
          <AmountInput value={creditLimit} onChange={setCreditLimit} currency={currency} size="md" />
          <p className="mt-1 text-xs text-muted">
            {t('Para ver tu cupo disponible al pagar con esta tarjeta.')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('Pago mínimo')}</label>
          <AmountInput value={minPayment} onChange={setMinPayment} currency={currency} size="md" />
        </div>
        <div>
          <label className="label">{t('Pago objetivo')}</label>
          <AmountInput
            value={targetPayment}
            onChange={setTargetPayment}
            currency={currency}
            size="md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('Día de corte')}</label>
          <input
            type="number"
            min={1}
            max={31}
            value={cutDay}
            onChange={(e) => setCutDay(e.target.value)}
            placeholder="1-31"
            className="input"
          />
        </div>
        <div>
          <label className="label">{t('Día de pago')}</label>
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
      </div>

      {/* Count toward the daily income goal */}
      <label className="flex items-start justify-between gap-3 rounded-xl border border-income/25 bg-income/[0.06] p-3">
        <span>
          <span className="block text-sm font-medium text-content">
            {t('Contar en la meta diaria de ingresos')}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {t('Si la desmarcas, esta deuda sigue en tu plan pero no se suma a lo que debes producir cada día.')}
          </span>
        </span>
        <input
          type="checkbox"
          checked={countInTarget}
          onChange={(e) => setCountInTarget(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-income"
        />
      </label>

      {editing && (
        <label className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 p-3">
          <span className="text-sm font-medium text-content">{t('Marcar como pagada')}</span>
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-5 w-5 accent-income"
          />
        </label>
      )}

      <div className="flex gap-3 pt-1">
        {editing && (
          <button type="button" onClick={onDelete} className="btn-danger" disabled={saving}>
            <Trash2 size={16} />
          </button>
        )}
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editing ? (
            t('Guardar cambios')
          ) : (
            t('Agregar deuda')
          )}
        </button>
      </div>
    </form>
  )
}
