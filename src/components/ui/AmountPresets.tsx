import type { Currency } from '@/types'

const PRESETS: Record<Currency, number[]> = {
  COP: [5000, 10000, 20000, 50000],
  USD: [5, 10, 20, 50],
}

/** Quick "+amount" chips to build up a figure fast (like a cash register). */
export function AmountPresets({
  currency,
  onAdd,
}: {
  currency: Currency
  onAdd: (delta: number) => void
}) {
  const locale = currency === 'COP' ? 'es-CO' : 'en-US'
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {PRESETS[currency].map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onAdd(p)}
          className="chip border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-content transition hover:bg-surface-3 active:scale-95"
        >
          +{p.toLocaleString(locale)}
        </button>
      ))}
    </div>
  )
}
