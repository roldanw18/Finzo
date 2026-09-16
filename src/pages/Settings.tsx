import { useRef, useState } from 'react'
import {
  User,
  Coins,
  Palette,
  Wallet,
  Database,
  Download,
  Upload,
  Trash2,
  LogOut,
  RotateCcw,
  Check,
  Moon,
  Sun,
  PlayCircle,
  Languages,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LangSwitch } from '@/components/LangSwitch'
import { ActivitySettings } from '@/components/ActivitySettings'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { usePrefs } from '@/store/prefs'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { toast } from '@/store/toast'
import { fetchUsdToCop } from '@/lib/exchange'
import type { Currency, ThemeMode } from '@/types'

export function Settings() {
  const profile = useStore((s) => s.profile)
  const mode = useStore((s) => s.mode)
  const demo = useStore((s) => s.demo)
  const enterDemo = useStore((s) => s.enterDemo)
  const categories = useStore((s) => s.categories)
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const setTheme = useStore((s) => s.setTheme)
  const saveProfile = useStore((s) => s.saveProfile)
  const signOut = useStore((s) => s.signOut)
  const resetLocal = useStore((s) => s.resetLocal)
  const loadDemoData = useStore((s) => s.loadDemoData)
  const importData = useStore((s) => s.importData)
  const { currency } = useMoney()
  const { t } = useI18n()

  const [name, setName] = useState(profile?.display_name ?? '')
  const [opening, setOpening] = useState(profile?.opening_balance ?? 0)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onSaveProfile() {
    setSavingProfile(true)
    try {
      await saveProfile({ display_name: name.trim() || null, opening_balance: opening })
      toast.success(t('Perfil actualizado'))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  function exportBackup() {
    const data = { profile, categories, incomes, expenses, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finzo_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('Respaldo descargado'))
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData({
        profile: data.profile,
        categories: data.categories,
        incomes: data.incomes,
        expenses: data.expenses,
      })
      toast.success(t('Datos importados'))
    } catch {
      toast.error(t('Archivo inválido'))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onReset() {
    if (!confirm(t('¿Borrar todos los datos locales? Esta acción no se puede deshacer.'))) return
    await resetLocal()
    toast.success(t('Datos reiniciados'))
  }

  const dark = profile?.theme !== 'light'

  return (
    <div className="space-y-5">
      <PageHeader title={t('Ajustes')} subtitle={t('Personaliza tu experiencia')} />

      {/* Profile */}
      <Card>
        <CardHeader title={t('Perfil')} icon={<User size={18} className="text-primary" />} />
        <div className="space-y-4">
          <div>
            <label className="label">{t('Nombre')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Tu nombre')}
              className="input"
            />
          </div>
          {mode === 'remote' && (
            <p className="text-xs text-muted">{t('Sesión iniciada como cuenta en la nube.')}</p>
          )}
          <button onClick={onSaveProfile} disabled={savingProfile} className="btn-primary">
            <Check size={16} /> {t('Guardar perfil')}
          </button>
        </div>
      </Card>

      {/* Activity / occupation */}
      <ActivitySettings />

      {/* Currency */}
      <CurrencyCard />

      {/* Theme */}
      <Card>
        <CardHeader
          title={t('Apariencia')}
          subtitle={t('Tema de la interfaz')}
          icon={<Palette size={18} className="text-primary" />}
        />
        <Segmented
          value={dark ? 'dark' : 'light'}
          onChange={(v: ThemeMode) => setTheme(v)}
          options={[
            { value: 'dark', label: t('🌙 Oscuro') },
            { value: 'light', label: t('☀️ Claro') },
          ]}
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {dark ? <Moon size={14} /> : <Sun size={14} />}
          {dark ? t('Tema oscuro activo') : t('Tema claro activo')}
        </div>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader
          title={t('Idioma / Language')}
          subtitle={t('Elige el idioma de la aplicación')}
          icon={<Languages size={18} className="text-primary" />}
        />
        <LangSwitch />
      </Card>

      {/* Opening balance */}
      <Card>
        <CardHeader
          title={t('Saldo inicial')}
          subtitle={t('Dinero que tenías antes de empezar a registrar')}
          icon={<Wallet size={18} className="text-primary" />}
        />
        <AmountInput value={opening} onChange={setOpening} currency={currency} size="md" />
        <button onClick={onSaveProfile} disabled={savingProfile} className="btn-ghost mt-3">
          <Check size={16} /> {t('Guardar saldo')}
        </button>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader
          title={t('Datos y respaldos')}
          subtitle={t('Exporta o restaura tu información')}
          icon={<Database size={18} className="text-primary" />}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={exportBackup} className="btn-outline justify-start">
            <Download size={16} /> {t('Exportar respaldo (JSON)')}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-outline justify-start">
            <Upload size={16} /> {t('Importar respaldo')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={onImportFile}
            className="hidden"
          />
          {mode === 'local' && (
            <>
              <button onClick={() => loadDemoData()} className="btn-outline justify-start">
                <RotateCcw size={16} /> {t('Recargar datos demo')}
              </button>
              <button onClick={onReset} className="btn-danger justify-start">
                <Trash2 size={16} /> {t('Borrar todos los datos')}
              </button>
            </>
          )}
        </div>
      </Card>

      {/* Demo mode */}
      {!demo && (
        <Card>
          <CardHeader
            title={t('Explorar modo demo')}
            subtitle={t('Mira la app llena de datos de ejemplo')}
            icon={<PlayCircle size={18} className="text-primary" />}
          />
          <p className="mb-3 text-sm text-muted">
            {t(
              'Carga varios meses de actividad ficticia para explorar todas las funciones. No afecta tus datos reales; puedes salir cuando quieras.',
            )}
          </p>
          <button onClick={() => enterDemo()} className="btn-outline">
            <PlayCircle size={16} /> {t('Entrar al modo demo')}
          </button>
        </Card>
      )}

      {/* Account */}
      {mode === 'remote' && !demo && (
        <Card>
          <CardHeader title={t('Cuenta')} icon={<LogOut size={18} className="text-expense" />} />
          <button onClick={() => signOut()} className="btn-danger">
            <LogOut size={16} /> {t('Cerrar sesión')}
          </button>
        </Card>
      )}

      <p className="pb-2 text-center text-xs text-subtle">
        {t('Finzo · Gestión financiera personal · v1.0')}
      </p>
    </div>
  )
}

/**
 * Non-destructive currency control. The base currency (profile.currency) is
 * where data is stored and never changes. The "view in" toggle only changes how
 * amounts are displayed, using a rate — switching back shows the exact originals.
 */
function CurrencyCard() {
  const { t } = useI18n()
  const base = useStore((s) => s.profile?.currency ?? 'COP') as Currency
  const displayCurrency = usePrefs((s) => s.displayCurrency)
  const rate = usePrefs((s) => s.rate)
  const setDisplayCurrency = usePrefs((s) => s.setDisplayCurrency)
  const setRate = usePrefs((s) => s.setRate)
  const [fetching, setFetching] = useState(false)

  const view: Currency = displayCurrency ?? base

  async function refreshRate() {
    setFetching(true)
    const r = await fetchUsdToCop()
    setFetching(false)
    if (r) {
      setRate(Math.round(r * 100) / 100)
      toast.success(t('Tasa actualizada ✓'))
    } else {
      toast.error(t('No pude obtener la tasa automáticamente. Ingrésala manualmente.'))
    }
  }

  function pick(v: Currency) {
    if (v === base) {
      setDisplayCurrency(null)
    } else {
      setDisplayCurrency(v)
      void refreshRate()
    }
  }

  return (
    <Card>
      <CardHeader
        title={t('Moneda')}
        subtitle={t('Cómo se muestran los montos')}
        icon={<Coins size={18} className="text-primary" />}
      />
      <p className="mb-3 text-xs text-muted">
        {t('Moneda principal: {c}. Tus datos se guardan así y no cambian.').replace('{c}', base)}
      </p>

      <label className="label">{t('Ver montos en')}</label>
      <Segmented
        value={view}
        onChange={pick}
        options={[
          { value: 'COP', label: t('Peso (COP) $') },
          { value: 'USD', label: t('Dólar (USD) $') },
        ]}
      />

      {view !== base && (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-surface-2/50 p-3">
          <label className="label mb-0">{t('Tasa de cambio (1 USD = ? COP)')}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">1 USD =</span>
            <input
              type="number"
              inputMode="decimal"
              value={rate || ''}
              onChange={(e) => setRate(Number(e.target.value))}
              className="input flex-1"
              step="0.01"
              min={0}
            />
            <span className="text-sm text-muted">COP</span>
            <button
              type="button"
              onClick={refreshRate}
              disabled={fetching}
              className="btn-ghost shrink-0"
              title={t('Actualizar tasa')}
            >
              {fetching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RotateCcw size={15} />
              )}
            </button>
          </div>
          <p className="text-xs text-muted">
            {t('Solo cambia cómo se ven los montos. Tus datos siguen en {c}.').replace('{c}', base)}
          </p>
        </div>
      )}
    </Card>
  )
}
