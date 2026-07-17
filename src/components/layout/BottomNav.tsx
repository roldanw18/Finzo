import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from '@/config/nav'
import { cn } from '@/lib/utils'

export function BottomNav() {
  return (
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
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
