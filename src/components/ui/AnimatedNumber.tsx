import { useEffect, useRef, useState } from 'react'
import { formatMoney } from '@/lib/utils'
import type { Currency } from '@/types'

interface Props {
  value: number
  currency: Currency
  compact?: boolean
  sign?: boolean
  className?: string
  duration?: number
}

/** Smoothly animates a money value when it changes. */
export function AnimatedNumber({
  value,
  currency,
  compact,
  sign,
  className,
  duration = 700,
}: Props) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, duration])

  return (
    <span className={className}>
      {formatMoney(display, currency, { compact, sign })}
    </span>
  )
}
