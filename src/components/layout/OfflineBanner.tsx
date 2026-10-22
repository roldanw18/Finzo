import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useI18n } from '@/i18n'

/** Shows a thin warning bar while the device is offline. */
export function OfflineBanner() {
  const { t } = useI18n()
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false,
  )

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2 text-xs font-medium text-warning">
      <WifiOff size={14} />
      {t('Sin conexión — tus cambios podrían no guardarse')}
    </div>
  )
}
