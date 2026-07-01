import { Wallet, Moon, Sun } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { initials } from '@/lib/utils'

export function MobileHeader() {
  const profile = useStore((s) => s.profile)
  const setTheme = useStore((s) => s.setTheme)
  const dark = profile?.theme !== 'light'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-contrast">
          <Wallet size={17} strokeWidth={2.4} />
        </span>
        <span className="font-display text-lg font-bold">Finzo</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted transition active:scale-95"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
          {initials(profile?.display_name)}
        </span>
      </div>
    </header>
  )
}
