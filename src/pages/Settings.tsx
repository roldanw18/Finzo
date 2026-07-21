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
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActivitySettings } from '@/components/ActivitySettings'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { AmountInput } from '@/components/ui/AmountInput'
import { useStore } from '@/store/useStore'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import type { Currency, ThemeMode } from '@/types'

export function Settings() {
  const profile = useStore((s) => s.profile)
  const mode = useStore((s) => s.mode)
  const categories = useStore((s) => s.categories)
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const setCurrency = useStore((s) => s.setCurrency)
  const setTheme = useStore((s) => s.setTheme)
  const saveProfile = useStore((s) => s.saveProfile)
  const signOut = useStore((s) => s.signOut)
  const resetLocal = useStore((s) => s.resetLocal)
  const loadDemoData = useStore((s) => s.loadDemoData)
  const importData = useStore((s) => s.importData)
  const { currency } = useMoney()

  const [name, setName] = useState(profile?.display_name ?? '')
  const [opening, setOpening] = useState(profile?.opening_balance ?? 0)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onSaveProfile() {
    setSavingProfile(true)
    try {
      await saveProfile({ display_name: name.trim() || null, opening_balance: opening })
      toast.success('Perfil actualizado')
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
    toast.success('Respaldo descargado')
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
      toast.success('Datos importados')
    } catch {
      toast.error('Archivo inválido')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onReset() {
    if (!confirm('¿Borrar todos los datos locales? Esta acción no se puede deshacer.')) return
    await resetLocal()
    toast.success('Datos reiniciados')
  }

  const dark = profile?.theme !== 'light'

  return (
    <div className="space-y-5">
      <PageHeader title="Ajustes" subtitle="Personaliza tu experiencia" />

      {/* Profile */}
      <Card>
        <CardHeader title="Perfil" icon={<User size={18} className="text-primary" />} />
        <div className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="input"
            />
          </div>
          {mode === 'remote' && (
            <p className="text-xs text-muted">Sesión iniciada como cuenta en la nube.</p>
          )}
          <button onClick={onSaveProfile} disabled={savingProfile} className="btn-primary">
            <Check size={16} /> Guardar perfil
          </button>
        </div>
      </Card>

      {/* Activity / occupation */}
      <ActivitySettings />

      {/* Currency */}
      <Card>
        <CardHeader
          title="Moneda"
          subtitle="Cómo se muestran los montos"
          icon={<Coins size={18} className="text-primary" />}
        />
        <Segmented
          value={currency}
          onChange={(v: Currency) => {
            setCurrency(v)
            toast.success(`Moneda: ${v}`)
          }}
          options={[
            { value: 'COP', label: 'Peso (COP) $' },
            { value: 'USD', label: 'Dólar (USD) $' },
          ]}
        />
        <p className="mt-3 text-xs text-muted">
          {currency === 'COP'
            ? 'Formato sin decimales: $ 1.250.000'
            : 'Formato con decimales: $1,250.00'}
        </p>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader
          title="Apariencia"
          subtitle="Tema de la interfaz"
          icon={<Palette size={18} className="text-primary" />}
        />
        <Segmented
          value={dark ? 'dark' : 'light'}
          onChange={(v: ThemeMode) => setTheme(v)}
          options={[
            { value: 'dark', label: '🌙 Oscuro' },
            { value: 'light', label: '☀️ Claro' },
          ]}
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {dark ? <Moon size={14} /> : <Sun size={14} />}
          Tema {dark ? 'oscuro' : 'claro'} activo
        </div>
      </Card>

      {/* Opening balance */}
      <Card>
        <CardHeader
          title="Saldo inicial"
          subtitle="Dinero que tenías antes de empezar a registrar"
          icon={<Wallet size={18} className="text-primary" />}
        />
        <AmountInput value={opening} onChange={setOpening} currency={currency} size="md" />
        <button onClick={onSaveProfile} disabled={savingProfile} className="btn-ghost mt-3">
          <Check size={16} /> Guardar saldo
        </button>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader
          title="Datos y respaldos"
          subtitle="Exporta o restaura tu información"
          icon={<Database size={18} className="text-primary" />}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={exportBackup} className="btn-outline justify-start">
            <Download size={16} /> Exportar respaldo (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-outline justify-start">
            <Upload size={16} /> Importar respaldo
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
                <RotateCcw size={16} /> Recargar datos demo
              </button>
              <button onClick={onReset} className="btn-danger justify-start">
                <Trash2 size={16} /> Borrar todos los datos
              </button>
            </>
          )}
        </div>
      </Card>

      {/* Account */}
      {mode === 'remote' && (
        <Card>
          <CardHeader title="Cuenta" icon={<LogOut size={18} className="text-expense" />} />
          <button onClick={() => signOut()} className="btn-danger">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </Card>
      )}

      <p className="pb-2 text-center text-xs text-subtle">
        Finzo · Gestión financiera personal · v1.0
      </p>
    </div>
  )
}
