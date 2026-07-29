import { useState } from 'react'
import { PlayCircle, X, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useI18n } from '@/i18n'

/** Sticky banner shown while exploring the demo, with a clear way out. */
export function DemoModeBanner() {
  const demo = useStore((s) => s.demo)
  const exitDemo = useStore((s) => s.exitDemo)
  const { t } = useI18n()
  const [leaving, setLeaving] = useState(false)

  if (!demo) return null

  async function leave() {
    setLeaving(true)
    try {
      await exitDemo()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-primary px-4 py-2 text-primary-contrast">
      <PlayCircle size={16} />
      <span className="text-sm font-medium">
        {t('Modo demo — explorando con datos de ejemplo')}
      </span>
      <button
        onClick={leave}
        disabled={leaving}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold transition hover:bg-black/25"
      >
        {leaving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        {t('Salir del demo')}
      </button>
    </div>
  )
}
