import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { Sparkline } from './ui/Sparkline'
import { useMoney } from '@/hooks/useMoney'
import { cn, formatPercent } from '@/lib/utils'

export type KpiTone = 'income' | 'expense' | 'info' | 'primary' | 'neutral'

const TONE: Record<KpiTone, { text: string; bg: string; ring: string; raw: string }> = {
  income: { text: 'text-income', bg: 'bg-income/10', ring: 'ring-income/20', raw: 'rgb(var(--c-income))' },
  expense: { text: 'text-expense', bg: 'bg-expense/10', ring: 'ring-expense/20', raw: 'rgb(var(--c-expense))' },
  info: { text: 'text-info', bg: 'bg-info/10', ring: 'ring-info/20', raw: 'rgb(var(--c-info))' },
  primary: { text: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20', raw: 'rgb(var(--c-primary))' },
  neutral: { text: 'text-muted', bg: 'bg-surface-2', ring: 'ring-border', raw: 'rgb(var(--c-muted))' },
}

interface Props {
  label: string
  value: number
  icon: LucideIcon
  tone?: KpiTone
  sign?: boolean
  compact?: boolean
  sub?: string
  delta?: number // percent change
  deltaInvert?: boolean // when true, positive delta is "bad" (e.g. expenses)
  spark?: number[]
  delay?: number
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  sign,
  compact,
  sub,
  delta,
  deltaInvert,
  spark,
  delay = 0,
}: Props) {
  const { currency } = useMoney()
  const t = TONE[tone]

  const deltaGood =
    delta === undefined ? null : deltaInvert ? delta <= 0 : delta >= 0
  const DeltaIcon =
    delta === undefined || delta === 0
      ? Minus
      : delta > 0
        ? ArrowUpRight
        : ArrowDownRight

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover relative overflow-hidden p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted truncate">{label}</p>
          <AnimatedNumber
            value={value}
            currency={currency}
            compact={compact}
            sign={sign}
            className={cn(
              'tnum mt-1.5 block font-display text-xl font-bold sm:text-2xl',
              tone === 'income' && 'text-income',
              tone === 'expense' && 'text-expense',
              (tone === 'neutral' || tone === 'primary' || tone === 'info') &&
                'text-content',
            )}
          />
        </div>
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl ring-1', t.bg, t.ring)}>
          <Icon size={18} className={t.text} />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {delta !== undefined && (
            <span
              className={cn(
                'chip text-[11px] font-semibold',
                deltaGood ? 'bg-income/12 text-income' : 'bg-expense/12 text-expense',
              )}
            >
              <DeltaIcon size={12} />
              {formatPercent(delta, 0)}
            </span>
          )}
          {sub && <span className="text-[11px] text-subtle truncate">{sub}</span>}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline data={spark} color={t.raw} width={64} height={24} />
        )}
      </div>
    </motion.div>
  )
}
