import { useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { nextRecommendedDebt } from '@/lib/debt'
import { cn } from '@/lib/utils'

interface Props {
  debtId?: string
  onDone: () => void
}

export function PaymentForm({ debtId, onDone }: Props) {
  const { currency, money } = useMoney()
  const { t } = useI18n()
  const debts = useStore((s) => s.debts)
  const addPayment = useStore((s) => s.addPayment)

  const active = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])
  const recommended = useMemo(() => nextRecommendedDebt(debts).debt, [debts])

  const [selected, setSelected] = useState(debtId ?? recommended?.id ?? active[0]?.id ?? '')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const debt = active.find((d) => d.id === selected)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return toast.error(t('Selecciona una deuda'))
    if (amount <= 0) return toast.error(t('Ingresa el monto del pago'))
    setSaving(true)
    try {
      await addPayment({ debt_id: selected, amount, date, note })
      toast.success(t('Pago registrado ✓'))
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (active.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        {t('No tienes deudas activas para registrar pagos.')}
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {recommended && selected !== recommended.id && (
        <button
          type="button"
          onClick={() => setSelected(recommended.id)}
          className="flex w-full items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-left text-xs text-primary"
        >
          <Sparkles size={14} />
          {t('Recomendado: abona a')} <b>{recommended.name}</b> {t('(mayor interés)')}
        </button>
      )}

      <div>
        <label className="label">{t('Deuda')}</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input">
          {active.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {money(d.balance, { compact: true })}
              {d.interest_rate ? ` (${d.interest_rate}%)` : t(' (sin interés)')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t('Monto del pago')}</label>
        <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus size="md" />
        {debt && (
          <div className="mt-2 flex flex-wrap gap-2">
            {debt.min_payment > 0 && (
              <button
                type="button"
                onClick={() => setAmount(debt.min_payment)}
                className="chip bg-surface-2 text-xs text-muted hover:bg-surface-3"
              >
                {t('Mínimo')} {money(debt.min_payment, { compact: true })}
              </button>
            )}
            {debt.target_payment > 0 && (
              <button
                type="button"
                onClick={() => setAmount(debt.target_payment)}
                className="chip bg-surface-2 text-xs text-muted hover:bg-surface-3"
              >
                {t('Objetivo')} {money(debt.target_payment, { compact: true })}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmount(debt.balance)}
              className="chip bg-surface-2 text-xs text-muted hover:bg-surface-3"
            >
              {t('Saldo total')} {money(debt.balance, { compact: true })}
            </button>
          </div>
        )}
      </div>

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
          <label className="label">{t('Comentario')}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ej. abono extra')}
            className="input"
          />
        </div>
      </div>

      {debt && amount > 0 && (
        <div className={cn('rounded-xl p-3 text-sm', amount >= debt.balance ? 'bg-income/10 text-income' : 'bg-surface-2 text-muted')}>
          {amount >= debt.balance
            ? t('🎉 ¡Con este pago liquidas "{name}" por completo!').replace('{name}', debt.name)
            : t('Saldo después del pago: {m}').replace('{m}', money(debt.balance - amount))}
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? <Loader2 size={16} className="animate-spin" /> : t('Registrar pago')}
      </button>
    </form>
  )
}
