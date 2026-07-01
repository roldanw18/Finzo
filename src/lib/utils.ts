import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_CONFIG: Record<
  Currency,
  { locale: string; maximumFractionDigits: number; symbol: string }
> = {
  COP: { locale: 'es-CO', maximumFractionDigits: 0, symbol: '$' },
  USD: { locale: 'en-US', maximumFractionDigits: 2, symbol: '$' },
}

/** Full currency string, e.g. "$ 1.250.000" (COP) or "$1,250.00" (USD). */
export function formatMoney(
  value: number,
  currency: Currency = 'COP',
  opts: { compact?: boolean; sign?: boolean } = {},
): string {
  const cfg = CURRENCY_CONFIG[currency]
  const abs = Math.abs(value)

  if (opts.compact && abs >= 1000) {
    const formatted = new Intl.NumberFormat(cfg.locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs)
    const prefix = value < 0 ? '-' : opts.sign && value > 0 ? '+' : ''
    return `${prefix}${cfg.symbol}${formatted}`
  }

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.maximumFractionDigits,
    maximumFractionDigits: cfg.maximumFractionDigits,
  }).format(abs)

  const prefix = value < 0 ? '-' : opts.sign && value > 0 ? '+' : ''
  return `${prefix}${cfg.symbol}${formatted}`
}

/** Compact plain number, e.g. 12.5k */
export function formatCompact(value: number, currency: Currency = 'COP'): string {
  return formatMoney(value, currency, { compact: true })
}

export function formatPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

/** Parse a user-typed amount string with thousands separators into a number. */
export function parseAmount(input: string): number {
  if (!input) return 0
  // Remove everything except digits, comma, dot, minus
  const cleaned = input.replace(/[^\d.,-]/g, '')
  // If both separators present, assume last one is decimal
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized = cleaned
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = cleaned.replace(/,/g, '')
    }
  } else if (lastComma > -1) {
    // Comma only — treat as decimal if it looks like one, else thousands
    const decimals = cleaned.length - lastComma - 1
    normalized = decimals <= 2 ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '')
  }
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

export function uid(): string {
  return crypto.randomUUID()
}

/** Safe division returning 0 instead of NaN/Infinity. */
export function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

/** Percent change from `prev` to `curr`. */
export function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100
  return ((curr - prev) / Math.abs(prev)) * 100
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
