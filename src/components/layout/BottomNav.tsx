import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { BOTTOM_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/config/nav'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = SECONDARY_NAV_ITEMS.some((i) => i.to === pathname)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-subtle',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-8 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-primary/12',
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {t(item.label)}
                </>
              )}
            </NavLink>
          ))}

          {/* "Más" — opens the sheet with the sections that aren't in the bar. */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label={t('Más')}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              moreActive ? 'text-primary' : 'text-subtle',
            )}
          >
            <span
              className={cn(
                'grid h-8 w-12 place-items-center rounded-full transition-colors',
                moreActive && 'bg-primary/12',
              )}
            >
              <MoreHorizontal size={20} strokeWidth={moreActive ? 2.5 : 2} />
            </span>
            {t('Más')}
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={t('Más')} maxWidth="max-w-sm">
        <div className="grid grid-cols-1 gap-1">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                  isActive ? 'bg-primary/12 text-primary' : 'text-content hover:bg-surface-2',
                )
              }
            >
              <item.icon size={20} /> {t(item.label)}
            </NavLink>
          ))}
        </div>
      </Modal>
    </>
  )
}
