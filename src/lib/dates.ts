import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfMonth,
  subMonths,
  subDays,
  isWithinInterval,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { usePrefs } from '@/store/prefs'

export const ISO = 'yyyy-MM-dd'

function locale() {
  return usePrefs.getState().lang === 'en' ? enUS : es
}

export function todayISO(): string {
  return format(new Date(), ISO)
}

export function toDate(iso: string): Date {
  return parseISO(iso)
}

export function fmt(iso: string | Date, pattern: string): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, pattern, { locale: locale() })
}

/** "30 jun" / "Jun 30" */
export function fmtShort(iso: string): string {
  return usePrefs.getState().lang === 'en' ? fmt(iso, 'MMM d') : fmt(iso, "d 'de' MMM")
}

/** "lunes, 30 de junio" / "Monday, June 30" */
export function fmtLong(iso: string | Date): string {
  return usePrefs.getState().lang === 'en' ? fmt(iso, 'EEEE, MMMM d') : fmt(iso, "EEEE, d 'de' MMMM")
}

/** "junio 2026" / "June 2026" */
export function fmtMonthYear(d: Date): string {
  return format(d, 'MMMM yyyy', { locale: locale() })
}

export function relativeDay(iso: string): string {
  const en = usePrefs.getState().lang === 'en'
  const diff = differenceInCalendarDays(new Date(), parseISO(iso))
  if (diff === 0) return en ? 'Today' : 'Hoy'
  if (diff === 1) return en ? 'Yesterday' : 'Ayer'
  if (diff === -1) return en ? 'Tomorrow' : 'Mañana'
  if (diff > 1 && diff < 7) return en ? `${diff} days ago` : `Hace ${diff} días`
  return fmtShort(iso)
}

export {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfMonth,
  subMonths,
  subDays,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  parseISO,
  format,
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7) // yyyy-MM
}

export function isSameMonth(iso: string, ref: Date): boolean {
  return iso.slice(0, 7) === format(ref, 'yyyy-MM')
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

export function daysElapsedInMonth(ref = new Date()): number {
  return ref.getDate()
}

export function daysInCurrentMonth(ref = new Date()): number {
  return endOfMonth(ref).getDate()
}
