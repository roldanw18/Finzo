import { type ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
        {icon ?? <Inbox size={24} />}
      </div>
      <div>
        <p className="font-medium text-content">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted max-w-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
