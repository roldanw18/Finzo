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
import { es } from 'date-fns/locale'

export const ISO = 'yyyy-MM-dd'

export function todayISO(): string {
  return format(new Date(), ISO)
}

export function toDate(iso: string): Date {
  return parseISO(iso)
}

export function fmt(iso: string | Date, pattern: string): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, pattern, { locale: es })
}

/** "30 jun" */
export function fmtShort(iso: string): string {
  return fmt(iso, "d 'de' MMM")
}

/** "lunes, 30 de junio" */
export function fmtLong(iso: string | Date): string {
  return fmt(iso, "EEEE, d 'de' MMMM")
}

/** "junio 2026" */
export function fmtMonthYear(d: Date): string {
  return format(d, 'MMMM yyyy', { locale: es })
}

export function relativeDay(iso: string): string {
  const diff = differenceInCalendarDays(new Date(), parseISO(iso))
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff === -1) return 'Mañana'
  if (diff > 1 && diff < 7) return `Hace ${diff} días`
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
