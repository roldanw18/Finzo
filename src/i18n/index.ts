import { usePrefs } from '@/store/prefs'
import { DICT, EN, type Lang, type TKey } from './dict'

export type { Lang, TKey }

/**
 * Resolve a string for a language. Two key styles are supported:
 *  - Semantic keys (e.g. 'nav.try') defined in DICT — used by landing/login.
 *  - Spanish source strings (gettext-style) — used across the in-app UI; the
 *    Spanish text IS the key, and EN holds its English translation.
 * When Spanish is active, semantic keys resolve via DICT.es and any other
 * string returns itself (it's already Spanish).
 */
export function translate(key: string, lang: Lang): string {
  if (lang === 'es') return DICT.es[key as TKey] ?? key
  return DICT.en[key as TKey] ?? EN[key] ?? key
}

/** Translation hook bound to the persisted language preference. */
export function useI18n() {
  const lang = usePrefs((s) => s.lang)
  const setLang = usePrefs((s) => s.setLang)
  const t = (key: string): string => translate(key, lang)
  return { t, lang, setLang }
}
