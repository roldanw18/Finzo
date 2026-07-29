import { Languages } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

/** Compact ES/EN language toggle. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5',
        className,
      )}
    >
      <Languages size={14} className="ml-1 text-subtle" />
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold uppercase transition',
            lang === l ? 'bg-primary text-primary-contrast' : 'text-muted hover:text-content',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
