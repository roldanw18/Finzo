import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { translate } from '@/i18n'
import { usePrefs } from '@/store/prefs'

interface State {
  hasError: boolean
}

/**
 * Catches render-time errors so a bug in one screen shows a friendly recovery
 * screen instead of a blank white page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[finzo] render error', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const lang = usePrefs.getState().lang
    const t = (k: string) => translate(k, lang)
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-expense/10 text-expense">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-display text-xl font-bold">{t('Algo salió mal')}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('La aplicación tuvo un problema. Recarga para continuar.')}
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-5">
            {t('Recargar')}
          </button>
        </div>
      </div>
    )
  }
}
