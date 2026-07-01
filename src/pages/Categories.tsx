import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useStore } from '@/store/useStore'
import { useUI } from '@/store/ui'
import { useMoney } from '@/hooks/useMoney'
import { expensesByCategory } from '@/lib/analytics'

export function Categories() {
  const categories = useStore((s) => s.categories)
  const expenses = useStore((s) => s.expenses)
  const openCategory = useUI((s) => s.openCategory)
  const { money } = useMoney()

  const stats = useMemo(() => {
    const slices = expensesByCategory(expenses, categories)
    const map = new Map(slices.map((s) => [s.id, s]))
    return map
  }, [expenses, categories])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categorías"
        subtitle={`${categories.length} categorías · personalízalas a tu gusto`}
        action={
          <button onClick={() => openCategory()} className="btn-primary">
            <Plus size={16} /> Nueva
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => {
          const s = stats.get(c.id)
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              onClick={() => openCategory(c)}
              className="card card-hover group flex items-center gap-3 p-4 text-left"
            >
              <CategoryIcon icon={c.icon} color={c.color} size={20} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-content">{c.name}</p>
                  {c.is_default && (
                    <span className="chip bg-surface-2 text-[10px] text-subtle">base</span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {s ? `${s.count} mov · ${money(s.value, { compact: true })}` : 'Sin movimientos'}
                </p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg text-subtle opacity-0 transition group-hover:opacity-100">
                <Pencil size={15} />
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
