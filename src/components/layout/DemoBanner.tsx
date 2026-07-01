import { Info } from 'lucide-react'
import { useStore } from '@/store/useStore'

export function DemoBanner() {
  const mode = useStore((s) => s.mode)
  if (mode !== 'local') return null
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-3.5 py-2.5 text-sm text-info">
      <Info size={16} className="mt-0.5 shrink-0" />
      <p className="leading-snug">
        <strong>Modo local (demo).</strong> Tus datos se guardan en este navegador con
        datos de ejemplo. Configura Supabase para sincronizar en la nube.
      </p>
    </div>
  )
}
