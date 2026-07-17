import { useEffect, useMemo, useState } from 'react'
import type { Currency } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange: (v: number) => void
  currency: Currency
  autoFocus?: boolean
  size?: 'md' | 'lg'
  placeholder?: string
}

function groupInteger(intPart: string, currency: Currency): string {
  if (!intPart) return ''
  const sep = currency === 'COP' ? '.' : ','
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

/** Big, fast money input with live grouping. */
export function AmountInput({
  value,
  onChange,
  currency,
  autoFocus,
  size = 'lg',
  placeholder,
}: Props) {
  const decimals = currency === 'USD' ? 2 : 0
  const groupSep = currency === 'COP' ? '.' : ','
  const decimalSep = currency === 'COP' ? ',' : '.'
  const [raw, setRaw] = useState<string>(value ? String(value) : '')

  // Sync only on genuine external value changes (e.g. editing a movement),
  // never on our own onChange — otherwise trailing decimals get clobbered.
  useEffect(() => {
    const current = raw ? parseFloat(raw) : 0
    if (value !== current) setRaw(value ? String(value) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const display = useMemo(() => {
    if (!raw) return ''
    const [int, dec] = raw.split('.')
    const grouped = groupInteger(int.replace(/^0+(?=\d)/, ''), currency)
    return dec !== undefined ? `${grouped}${decimalSep}${dec}` : grouped
  }, [raw, currency, decimalSep])

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip grouping separators first, then normalize the decimal separator
    // to '.', so the thousands '.' in COP is never mistaken for a decimal.
    let v = e.target.value.split(groupSep).join('')
    v = v.split(decimalSep).join('.')
    v = v.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    if (decimals === 0) {
      v = v.split('.')[0]
    } else {
      const [int, dec] = v.split('.')
      if (dec !== undefined) v = int + '.' + dec.slice(0, decimals)
    }
    setRaw(v)
    onChange(v ? parseFloat(v) : 0)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-2xl border border-border bg-surface-2 px-4 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20',
        size === 'lg' ? 'py-3' : 'py-2.5',
      )}
    >
      <span
        className={cn(
          'font-display font-semibold text-muted',
          size === 'lg' ? 'text-2xl' : 'text-lg',
        )}
      >
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={display}
        onChange={handle}
        placeholder={placeholder ?? '0'}
        className={cn(
          'tnum w-full bg-transparent font-display font-bold text-content outline-none placeholder:text-subtle',
          size === 'lg' ? 'text-3xl' : 'text-xl',
        )}
      />
      <span className="text-xs font-semibold text-subtle">{currency}</span>
    </div>
  )
}
