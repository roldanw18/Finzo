import { usePrefs } from '@/store/prefs'
import { DICT, type Lang, type TKey } from './dict'

export type { Lang, TKey }

/** Translation hook bound to the persisted language preference. */
export function useI18n() {
  const lang = usePrefs((s) => s.lang)
  const setLang = usePrefs((s) => s.setLang)
  const t = (key: TKey): string => DICT[lang][key] ?? DICT.es[key] ?? key
  return { t, lang, setLang }
}
