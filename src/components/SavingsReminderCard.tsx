import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PiggyBank, Bell, ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { getIcon } from '@/lib/icons'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { savingsReminders, totalDailySavings } from '@/lib/savings'
import { todayISO } from '@/lib/dates'

/** Daily nudge to set money aside for each savings goal + a browser notification. */
export function SavingsReminderCard() {
  const savingsGoals = useStore((s) => s.savingsGoals)
  const { money } = useMoney()
  const { t } = useI18n()

  const reminders = savingsReminders(savingsGoals)
  const total = totalDailySavings(savingsGoals)

  // Fire a once-per-day browser notification reminding to save today.
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    if (reminders.length === 0) return
    const key = `finzo:savings-notified:${todayISO()}`
    if (localStorage.getItem(key)) return
    try {
      new Notification(t('Recordatorio de ahorro de hoy'), {
        body: `${t('Aparta')} ${money(total)} ${t('hoy para tus metas de ahorro')}`,
        icon: '/pwa-192x192.png',
      })
      localStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
  }, [reminders.length, total])

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

  if (reminders.length === 0) return null

  return (
    <Card>
      <CardHeader
        title={t('Recordatorio de ahorro de hoy')}
        subtitle={`${t('Aparta')} ${money(total)} ${t('para tus metas')}`}
        icon={<PiggyBank size={18} className="text-income" />}
        action={
          <Link
            to="/ahorro"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t('Registrar aporte')} <ChevronRight size={14} />
          </Link>
        }
      />
      <div className="space-y-1.5">
        {reminders.map(({ goal, amount }) => {
          const Icon = getIcon(goal.icon)
          return (
            <div key={goal.id} className="flex items-center gap-3 rounded-xl bg-surface-2/50 p-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: `${goal.color}22`, color: goal.color }}
              >
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content">{goal.name}</p>
                <p className="text-xs text-muted">{t('Ahorra cada día')}</p>
              </div>
              <span className="tnum shrink-0 text-sm font-semibold" style={{ color: goal.color }}>
                {money(amount, { compact: true })}
              </span>
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
