import { translate } from '@/i18n'
import { usePrefs } from '@/store/prefs'

/**
 * Turn a raw thrown error into a short, friendly message for a toast.
 * Keeps the technical detail in the console for debugging, but never shows a
 * cryptic Supabase/network string to the user.
 */
export function friendlyError(err: unknown): string {
  const lang = usePrefs.getState().lang
  const raw = err instanceof Error ? err.message : String(err ?? '')
  if (raw) console.error('[finzo]', raw)

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  if (offline || /network|fetch|failed to fetch|timeout|offline|connection/i.test(raw)) {
    return translate('Sin conexión. Revisa tu internet e intenta de nuevo.', lang)
  }
  return translate('No se pudo completar. Intenta de nuevo.', lang)
}
