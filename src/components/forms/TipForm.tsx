import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Delete, Check, Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import { todayISO } from '@/lib/dates'
import { cn, formatMoney } from '@/lib/utils'

interface Props {
  /** Called after a tip is saved (e.g. to close a modal). Omit to stay open. */
  onSaved?: () => void
  autoFocusHint?: boolean
}

const PRESETS: Record<'COP' | 'USD', number[]> = {
  // minor units: COP = pesos, USD = cents
  COP: [1000, 2000, 5000, 10000],
  USD: [100, 200, 500, 1000],
}

export function TipForm({ onSaved }: Props) {
  const { currency, money } = useMoney()
  const addIncome = useStore((s) => s.addIncome)
  const incomes = useStore((s) => s.incomes)

  const factor = currency === 'USD' ? 100 : 1
  const [minor, setMinor] = useState(0)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const value = minor / factor

  const todayTips = useMemo(
    () =>
      incomes
        .filter((i) => i.source === 'tip' && i.date === todayISO())
        .reduce((a, i) => a + i.amount, 0),
    [incomes],
  )

  function press(d: string) {
    setJustSaved(false)
    setMinor((m) => {
      if (String(m).length >= 10) return m
      if (d === '000') return m * 1000
      return m * 10 + Number(d)
    })
  }
  function backspace() {
    setMinor((m) => Math.floor(m / 10))
  }
  function addPreset(p: number) {
    setJustSaved(false)
    setMinor((m) => m + p)
  }

  async function save() {
    if (value <= 0) {
      toast.error('Ingresa un valor de propina')
      return
    }
    setSaving(true)
    try {
      await addIncome({ amount: value, date: todayISO(), note: null, source: 'tip' })
      setMinor(0)
      setJustSaved(true)
      toast.success(`Propina de ${money(value)} guardada 🎉`)
      onSaved?.()
      setTimeout(() => setJustSaved(false), 1500)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫']

  return (
    <div className="flex flex-col gap-4">
      {/* Today total */}
      <div className="flex items-center justify-between rounded-2xl bg-[#14b8a6]/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14b8a6]/20 text-[#14b8a6]">
            <Coins size={18} />
          </span>
          <span className="text-sm text-muted">Propinas de hoy</span>
        </div>
        <span className="tnum font-display text-base font-bold text-[#14b8a6]">
          {money(todayTips)}
        </span>
      </div>

      {/* Amount display */}
      <div className="relative py-3 text-center">
        <AnimatePresence>
          {justSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 -top-1 mx-auto w-max rounded-full bg-income/15 px-3 py-1 text-xs font-semibold text-income"
            >
              ¡Guardada! Agrega otra
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          key={minor}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className={cn(
            'tnum font-display text-5xl font-bold tracking-tight',
            value > 0 ? 'text-content' : 'text-subtle',
          )}
        >
          {formatMoney(value, currency)}
        </motion.div>
        <p className="mt-1 text-xs text-subtle">Toca guardar cuando termines</p>
      </div>

      {/* Preset chips */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS[currency].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => addPreset(p)}
            className="rounded-xl border border-border bg-surface-2 py-2 text-sm font-semibold text-content transition active:scale-95 hover:bg-surface-3"
          >
            +{money(p / factor, { compact: true })}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => (k === '⌫' ? backspace() : press(k))}
            className={cn(
              'grid h-14 place-items-center rounded-xl text-xl font-semibold transition active:scale-95',
              k === '⌫'
                ? 'bg-surface-2 text-muted hover:bg-surface-3'
                : 'bg-surface-2 text-content hover:bg-surface-3',
            )}
          >
            {k === '⌫' ? <Delete size={22} /> : k}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={save}
        disabled={saving || value <= 0}
        className="btn h-14 w-full bg-[#14b8a6] text-base text-white hover:brightness-105 disabled:opacity-40"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <Check size={18} /> Guardar propina
          </>
        )}
      </button>
    </div>
  )
}
