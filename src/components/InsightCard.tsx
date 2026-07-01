import { motion } from 'framer-motion'
import {
  Flame,
  Leaf,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  GitCompareArrows,
  CalendarClock,
  Trophy,
  Scissors,
  Repeat,
  PiggyBank,
  GaugeCircle,
  Fuel,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import { useMoney } from '@/hooks/useMoney'
import { cn } from '@/lib/utils'
import type { Insight, Tone } from '@/lib/insights'

export const INSIGHT_ICONS: Record<string, LucideIcon> = {
  Flame,
  Leaf,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  GitCompareArrows,
  CalendarClock,
  Trophy,
  Scissors,
  Repeat,
  PiggyBank,
  GaugeCircle,
  Fuel,
  Lightbulb,
}

const TONE_STYLES: Record<Tone, { wrap: string; icon: string }> = {
  positive: { wrap: 'border-income/25 bg-income/[0.07]', icon: 'bg-income/15 text-income' },
  negative: { wrap: 'border-expense/25 bg-expense/[0.07]', icon: 'bg-expense/15 text-expense' },
  warning: { wrap: 'border-warning/25 bg-warning/[0.07]', icon: 'bg-warning/15 text-warning' },
  info: { wrap: 'border-info/25 bg-info/[0.07]', icon: 'bg-info/15 text-info' },
  neutral: { wrap: 'border-border bg-surface', icon: 'bg-surface-2 text-muted' },
}

export function InsightCard({ insight, delay = 0 }: { insight: Insight; delay?: number }) {
  const { money } = useMoney()
  const Icon = INSIGHT_ICONS[insight.icon] ?? Lightbulb
  const t = TONE_STYLES[insight.tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn('rounded-2xl border p-4', t.wrap)}
    >
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', t.icon)}>
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-content">{insight.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{insight.description}</p>
          {insight.value !== undefined && (
            <p className="tnum mt-1.5 font-display text-lg font-bold text-content">
              {money(insight.value)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
