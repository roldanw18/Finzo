import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, PiggyBank, Pencil, Loader2, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Segmented } from '@/components/ui/Segmented'
import { AmountInput } from '@/components/ui/AmountInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { SavingsGoalForm } from '@/components/forms/SavingsGoalForm'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { fmtShort } from '@/lib/dates'
import { safeDiv } from '@/lib/utils'
import type { SavingsGoal } from '@/types'

type Sheet =
  | { type: 'none' }
  | { type: 'form'; editing?: SavingsGoal }
  | { type: 'contribute'; goal: SavingsGoal }

function daysLeft(iso: string): number {
  const target = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function Savings() {
  const savingsGoals = useStore((s) => s.savingsGoals)
  const { money } = useMoney()
  const { t } = useI18n()
  const [sheet, setSheet] = useState<Sheet>({ type: 'none' })
  const close = () => setSheet({ type: 'none' })

  const totals = useMemo(() => {
    const saved = savingsGoals.reduce((a, g) => a + g.saved_amount, 0)
    const target = savingsGoals.reduce((a, g) => a + g.target_amount, 0)
    const done = savingsGoals.filter((g) => g.saved_amount >= g.target_amount && g.target_amount > 0).length
    return { saved, target, done, pct: safeDiv(saved, target) * 100 }
  }, [savingsGoals])

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Metas de ahorro')}
        subtitle={t('Aparta dinero para lo que viene y mira tu progreso')}
        action={
          <button onClick={() => setSheet({ type: 'form' })} className="btn-primary">
            <Plus size={16} /> {t('Nueva meta')}
          </button>
        }
      />

      {savingsGoals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank size={22} />}
            title={t('Aún no tienes metas de ahorro')}
            description={t(
              'Crea tu primera meta —un fondo de emergencia, un viaje, un equipo nuevo— y ve creciendo tu ahorro.',
            )}
            action={
              <button onClick={() => setSheet({ type: 'form' })} className="btn-primary mt-1">
                <Plus size={16} /> {t('Crear meta')}
              </button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-bg-soft p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 text-muted">
              <PiggyBank size={16} />
              <span className="text-sm">{t('Ahorro total apartado')}</span>
            </div>
            <p className="tnum mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl text-income">
              {money(totals.saved)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('de')} {money(totals.target)} · {savingsGoals.length}{' '}
              {savingsGoals.length === 1 ? t('meta') : t('metas')}
              {totals.done > 0 && (
                <span className="text-income">
                  {' '}· {totals.done} {totals.done === 1 ? t('completada') : t('completadas')} ✓
                </span>
              )}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-income transition-all"
                style={{ width: `${Math.min(100, totals.pct)}%` }}
              />
            </div>
          </motion.div>

          {/* Goals grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savingsGoals.map((g, i) => {
              const Icon = getIcon(g.icon)
              const pct = safeDiv(g.saved_amount, g.target_amount) * 100
              const done = g.target_amount > 0 && g.saved_amount >= g.target_amount
              const remaining = Math.max(0, g.target_amount - g.saved_amount)
              const dl = g.target_date ? daysLeft(g.target_date) : null
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="card flex flex-col gap-3 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{ background: `${g.color}22`, color: g.color }}
                    >
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-content">{g.name}</p>
                      <p className="text-xs text-muted">
                        {done ? (
                          <span className="inline-flex items-center gap-1 text-income">
                            <CheckCircle2 size={12} /> {t('¡Meta cumplida!')}
                          </span>
                        ) : dl !== null ? (
                          dl >= 0 ? (
                            <>{t('Faltan')} {dl} {dl === 1 ? t('día') : t('días')} · {fmtShort(g.target_date!)}</>
                          ) : (
                            <span className="text-expense">{t('Venció')} {fmtShort(g.target_date!)}</span>
                          )
                        ) : (
                          <>{t('Faltan')} {money(remaining, { compact: true })}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setSheet({ type: 'form', editing: g })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-content"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="tnum text-content">
                        {money(g.saved_amount, { compact: true })}
                      </span>
                      <span className="tnum text-muted">
                        {money(g.target_amount, { compact: true })}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(pct, 2))}%`, background: g.color }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] font-semibold" style={{ color: g.color }}>
                      {pct.toFixed(0)}%
                    </p>
                  </div>

                  <button
                    onClick={() => setSheet({ type: 'contribute', goal: g })}
                    className="btn-outline w-full justify-center py-2 text-sm"
                  >
                    <Plus size={15} /> {t('Registrar aporte')}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={sheet.type === 'form'}
        onClose={close}
        title={sheet.type === 'form' && sheet.editing ? t('Editar meta') : t('Nueva meta de ahorro')}
      >
        {sheet.type === 'form' && (
          <SavingsGoalForm editing={sheet.editing} onDone={close} />
        )}
      </Modal>

      <Modal
        open={sheet.type === 'contribute'}
        onClose={close}
        title={t('Registrar aporte')}
        maxWidth="max-w-sm"
      >
        {sheet.type === 'contribute' && <ContributeForm goal={sheet.goal} onDone={close} />}
      </Modal>
    </div>
  )
}

function ContributeForm({ goal, onDone }: { goal: SavingsGoal; onDone: () => void }) {
  const { currency, money } = useMoney()
  const { t } = useI18n()
  const contributeSavings = useStore((s) => s.contributeSavings)
  const [dir, setDir] = useState<'add' | 'withdraw'>('add')
  const [amount, setAmount] = useState(0)
  const [busy, setBusy] = useState(false)

  const remaining = Math.max(0, goal.target_amount - goal.saved_amount)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0) return toast.error(t('Ingresa un monto'))
    setBusy(true)
    try {
      await contributeSavings(goal.id, dir === 'add' ? amount : -amount)
      toast.success(dir === 'add' ? t('Aporte registrado ✓') : t('Retiro registrado'))
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-2 p-3.5 text-sm">
        <p className="font-medium text-content">{goal.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {t('Ahorrado')} {money(goal.saved_amount)} · {t('faltan')}{' '}
          <b className="tnum text-content">{money(remaining)}</b>
        </p>
      </div>

      <Segmented
        value={dir}
        onChange={setDir}
        size="sm"
        options={[
          { value: 'add', label: `＋ ${t('Aportar')}` },
          { value: 'withdraw', label: `− ${t('Retirar')}` },
        ]}
      />

      <AmountInput value={amount} onChange={setAmount} currency={currency} autoFocus />

      {dir === 'add' && remaining > 0 && (
        <button
          type="button"
          onClick={() => setAmount(remaining)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('Completar meta')} ({money(remaining, { compact: true })})
        </button>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : dir === 'add' ? (
          <>
            <Plus size={16} /> {t('Registrar aporte')}
          </>
        ) : (
          <>
            <Minus size={16} /> {t('Registrar retiro')}
          </>
        )}
      </button>
    </form>
  )
}
