import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { expensesByCategory, sum } from '@/lib/analytics'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  fmtMonthYear,
  isWithinInterval,
  parseISO,
} from '@/lib/dates'
import { safeDiv } from '@/lib/utils'

export function MonthlyReport() {
  const { incomes, expenses, categories, debtPayments, profile } = useAnalytics()
  const { money } = useMoney()
  const { t } = useI18n()
  const cardRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0) // months back from current
  const [busy, setBusy] = useState(false)

  const ref = useMemo(() => subMonths(new Date(), offset), [offset])
  const range = useMemo(() => ({ start: startOfMonth(ref), end: endOfMonth(ref) }), [ref])
  const inRange = (d: string) => isWithinInterval(parseISO(d), range)

  const data = useMemo(() => {
    const monthIncomes = incomes.filter((i) => inRange(i.date))
    const income = sum(monthIncomes, (i) => i.amount)
    const tips = sum(monthIncomes.filter((i) => i.source === 'tip'), (i) => i.amount)
    const expenseCash = sum(
      expenses.filter((e) => inRange(e.date)),
      (e) => e.amount,
    )
    const debtPaid = sum(
      debtPayments.filter((p) => inRange(p.date)),
      (p) => p.amount,
    )
    const expense = expenseCash + debtPaid
    const balance = income - expense
    const cats = expensesByCategory(expenses, categories, range, debtPayments).slice(0, 4)
    return { income, expense, balance, tips, cats, savingsRate: safeDiv(balance, income) * 100 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes, expenses, categories, debtPayments, offset])

  const maxCat = data.cats[0]?.value ?? 1
  const hasData = data.income > 0 || data.expense > 0

  async function capture(share: boolean) {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0b0e11',
        scale: 2,
        logging: false,
      })
      const blob: Blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b as Blob), 'image/png'),
      )
      const file = new File([blob], `finzo_${fmtMonthYear(ref)}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
      if (share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: t('Mi mes en Finzo') })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        toast.success(t('Imagen descargada'))
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t('Reporte mensual')} subtitle={t('Tu resumen listo para compartir')} />

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-content"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="w-44 text-center font-display text-lg font-bold capitalize">
          {fmtMonthYear(ref)}
        </span>
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-content disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Capturable report card */}
      <div className="mx-auto max-w-md">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-bg-soft p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-contrast">
                <Wallet size={17} strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-bold">Finzo</span>
            </div>
            <span className="text-xs capitalize text-muted">{fmtMonthYear(ref)}</span>
          </div>

          {!hasData ? (
            <p className="py-12 text-center text-sm text-muted">{t('Sin movimientos este mes.')}</p>
          ) : (
            <>
              <div className="mt-6 text-center">
                <p className="text-xs uppercase tracking-widest text-subtle">{t('Balance del mes')}</p>
                <p
                  className={`tnum mt-1 font-display text-4xl font-bold ${
                    data.balance >= 0 ? 'text-income' : 'text-expense'
                  }`}
                >
                  {money(data.balance, { sign: true })}
                </p>
                {data.income > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {t('Tasa de ahorro')} {data.savingsRate.toFixed(0)}%
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-income/10 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-muted">
                    <TrendingUp size={13} className="text-income" /> {t('Ingresos')}
                  </p>
                  <p className="tnum mt-0.5 font-display text-lg font-bold text-income">
                    {money(data.income, { compact: true })}
                  </p>
                </div>
                <div className="rounded-2xl bg-expense/10 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-muted">
                    <TrendingDown size={13} className="text-expense" /> {t('Gastos')}
                  </p>
                  <p className="tnum mt-0.5 font-display text-lg font-bold text-expense">
                    {money(data.expense, { compact: true })}
                  </p>
                </div>
              </div>

              {data.tips > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#14b8a6]/10 p-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Coins size={14} className="text-[#14b8a6]" /> {t('Propinas del mes')}
                  </span>
                  <span className="tnum text-sm font-bold text-[#14b8a6]">
                    {money(data.tips, { compact: true })}
                  </span>
                </div>
              )}

              {data.cats.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-widest text-subtle">
                    {t('En qué se fue')}
                  </p>
                  <div className="space-y-2.5">
                    {data.cats.map((c) => (
                      <div key={c.id} className="flex items-center gap-2.5">
                        <CategoryIcon icon={c.icon} color={c.color} size={13} />
                        <span className="min-w-0 flex-1 truncate text-sm text-content">
                          {c.name}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(c.value / maxCat) * 100}%`, background: c.color }}
                          />
                        </div>
                        <span className="tnum w-10 text-right text-xs text-muted">
                          {c.pct.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-6 text-center text-xs text-subtle">
                {profile?.display_name ? `${profile.display_name} · ` : ''}
                {t('Generado con Finzo')}
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      {hasData && (
        <div className="mx-auto flex max-w-md gap-3">
          <button onClick={() => capture(true)} disabled={busy} className="btn-primary flex-1">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            {t('Compartir')}
          </button>
          <button onClick={() => capture(false)} disabled={busy} className="btn-outline">
            <Download size={16} /> {t('Descargar')}
          </button>
        </div>
      )}
    </div>
  )
}
