import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Bell, ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { reminderCategoryMeta } from '@/types'
import { todayISO, fmtShort } from '@/lib/dates'
import { cn } from '@/lib/utils'

const URGENCY = {
  red: 'text-expense bg-expense/12',
  yellow: 'text-warning bg-warning/12',
  green: 'text-income bg-income/12',
}

/** Shows obligations due within the next week and offers browser reminders. */
export function DueSoonCard() {
  const { calendar } = useDebt()
  const { money } = useMoney()
  const { t } = useI18n()

  const soon = calendar.filter((c) => c.daysUntil <= 7).slice(0, 6)

  // Fire a once-per-day browser notification for items due today/overdue.
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const dueToday = calendar.filter((c) => c.daysUntil <= 0)
    if (dueToday.length === 0) return
    const key = `finzo:notified:${todayISO()}`
    if (localStorage.getItem(key)) return
    try {
      new Notification(t('Finzo · Vencimientos de hoy'), {
        body: dueToday.map((c) => c.title).join(' · '),
        icon: '/pwa-192x192.png',
      })
      localStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
  }, [calendar])

  const [perm, setPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  async function enable() {
    if (typeof Notification === 'undefined') {
      toast.error(t('Tu navegador no soporta avisos'))
      return
    }
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') toast.success(t('Avisos activados 🔔'))
  }

  if (soon.length === 0) return null

  return (
    <Card>
      <CardHeader
        title={t('Próximos vencimientos')}
        subtitle={t('En los próximos 7 días')}
        icon={<BellRing size={18} className="text-warning" />}
        action={
          <Link
            to="/plan"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t('Calendario')} <ChevronRight size={14} />
          </Link>
        }
      />
      <div className="space-y-1.5">
        {soon.map((c) => {
          const meta = reminderCategoryMeta(c.category)
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 p-2.5">
              <span
                className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold', URGENCY[c.urgency])}
              >
                {c.date.getDate()}
              </span>
              <CategoryIcon icon={meta.icon} color={meta.color} size={15} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content">{c.title}</p>
                <p className="text-xs text-muted">
                  {fmtShort(c.date.toISOString().slice(0, 10))}
                  {c.daysUntil <= 0 ? ` · ${t('hoy')}` : ` · ${c.daysUntil}d`}
                </p>
              </div>
              {c.amount && (
                <span className="tnum shrink-0 text-sm font-semibold text-content">
                  {money(c.amount, { compact: true })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {perm !== 'granted' && (
        <button onClick={enable} className="btn-ghost mt-3 w-full text-sm">
          <Bell size={15} /> {t('Activar avisos en el navegador')}
        </button>
      )}
    </Card>
  )
}
