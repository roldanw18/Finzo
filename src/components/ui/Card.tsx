import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function Card({ children, className, hover, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('card p-5', hover && 'card-hover', className)}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-content truncate">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
