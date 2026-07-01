import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface Props {
  icon: string
  color: string
  size?: number
  className?: string
  /** When true, uses a soft tinted background. */
  soft?: boolean
}

export function CategoryIcon({ icon, color, size = 18, className, soft = true }: Props) {
  const Icon = getIcon(icon)
  const box = size + 18
  return (
    <span
      className={cn('grid place-items-center rounded-xl shrink-0', className)}
      style={{
        width: box,
        height: box,
        background: soft ? `${color}22` : color,
        color: soft ? color : '#fff',
      }}
    >
      <Icon size={size} strokeWidth={2.2} />
    </span>
  )
}
