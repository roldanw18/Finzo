import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X, ArrowDownUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState } from '@/components/ui/EmptyState'
import { MovementRow } from '@/components/MovementRow'
import { ExportButtons } from '@/components/ExportButtons'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { fmtLong } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Movement } from '@/types'

type Kind = 'all' | 'income' | 'expense'
type Sort = 'recent' | 'amount'

export function History() {
  const { movements, categories, kpis } = useAnalytics()
  const { incomeLabel } = useActivity()
  const { money } = useMoney()

  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<Kind>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const minN = min ? parseFloat(min) : null
    const maxN = max ? parseFloat(max) : null
    const result = movements.filter((m) => {
      if (kind !== 'all' && m.kind !== kind) return false
      if (categoryId !== 'all') {
        if (categoryId === 'income' && m.kind !== 'income') return false
        if (categoryId !== 'income' && m.categoryId !== categoryId) return false
      }
      if (from && m.date < from) return false
      if (to && m.date > to) return false
      if (minN !== null && m.amount < minN) return false
      if (maxN !== null && m.amount > maxN) return false
      if (q) {
        const hay = `${m.title} ${m.categoryName} ${m.notes ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'amount') {
      result.sort((a, b) => b.amount - a.amount)
    }
    return result
  }, [movements, search, kind, categoryId, from, to, min, max, sort])

  const totals = useMemo(() => {
    let inc = 0
    let exp = 0
    for (const m of filtered) {
      if (m.kind === 'income') inc += m.amount
      else exp += m.amount
    }
    return { inc, exp, net: inc - exp, count: filtered.length }
  }, [filtered])

  const grouped = useMemo(() => {
    if (sort === 'amount') return null
    const map = new Map<string, Movement[]>()
    for (const m of filtered) {
      const arr = map.get(m.date) ?? []
      arr.push(m)
      map.set(m.date, arr)
    }
    return [...map.entries()]
  }, [filtered, sort])

  const activeFilters =
    (kind !== 'all' ? 1 : 0) +
    (categoryId !== 'all' ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (min ? 1 : 0) +
    (max ? 1 : 0)

  function clearFilters() {
    setKind('all')
    setCategoryId('all')
    setFrom('')
    setTo('')
    setMin('')
    setMax('')
    setSearch('')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Historial"
        subtitle={`${totals.count} movimientos`}
        action={
          <ExportButtons
            movements={filtered}
            kpis={kpis}
            title="Historial de movimientos"
            periodLabel={from || to ? `${from || '...'} a ${to || '...'}` : 'Todos los movimientos'}
          />
        }
      />

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3.5">
          <p className="text-xs text-muted">Ingresos</p>
          <p className="tnum mt-0.5 font-display text-base font-bold text-income sm:text-lg">
            {money(totals.inc, { compact: true })}
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-xs text-muted">Gastos</p>
          <p className="tnum mt-0.5 font-display text-base font-bold text-expense sm:text-lg">
            {money(totals.exp, { compact: true })}
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-xs text-muted">Neto</p>
          <p
            className={cn(
              'tnum mt-0.5 font-display text-base font-bold sm:text-lg',
              totals.net >= 0 ? 'text-income' : 'text-expense',
            )}
          >
            {money(totals.net, { sign: true, compact: true })}
          </p>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por texto, categoría o nota…"
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn('btn-ghost relative', showFilters && 'bg-surface-3')}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilters > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-contrast">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="label">Tipo</label>
              <Segmented
                value={kind}
                onChange={setKind}
                size="sm"
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'income', label: 'Ingresos' },
                  { value: 'expense', label: 'Gastos' },
                ]}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="label">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="all">Todas</option>
                <option value="income">{incomeLabel}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Monto mín.</label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>
            <div>
              <label className="label">Monto máx.</label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="∞"
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setSort(sort === 'recent' ? 'amount' : 'recent')}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-content"
            >
              <ArrowDownUp size={15} />
              Orden: {sort === 'recent' ? 'Más reciente' : 'Mayor monto'}
            </button>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-expense hover:underline">
                <X size={15} /> Limpiar filtros
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={22} />}
            title="Sin resultados"
            description="Ajusta los filtros o registra nuevos movimientos."
          />
        </Card>
      ) : grouped ? (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="mb-1 px-2 text-xs font-semibold capitalize text-subtle">
                {fmtLong(date)}
              </p>
              <Card className="!p-2">
                {items.map((m) => (
                  <MovementRow key={`${m.kind}-${m.id}`} m={m} showDate={false} />
                ))}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card className="!p-2">
          {filtered.map((m) => (
            <MovementRow key={`${m.kind}-${m.id}`} m={m} />
          ))}
        </Card>
      )}
    </div>
  )
}
