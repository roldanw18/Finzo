import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-lg font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active ? 'text-primary-contrast' : 'text-muted hover:text-content',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join('')}`}
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
