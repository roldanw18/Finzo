import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Loader2, Mail, Lock, TrendingUp, PieChart, ShieldCheck } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'

export function Login() {
  const signIn = useStore((s) => s.signIn)
  const signUp = useStore((s) => s.signUp)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) {
      toast.error('Correo válido y contraseña de 6+ caracteres')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const { needsConfirm } = await signUp(email, password)
        if (needsConfirm) {
          toast.info('Revisa tu correo para confirmar la cuenta')
          setMode('signin')
        }
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-bg-soft p-12 lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: 'rgb(var(--c-primary))' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgb(var(--c-income))' }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-contrast">
            <Wallet size={22} strokeWidth={2.4} />
          </span>
          <span className="font-display text-2xl font-bold">Finzo</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Toma el control de tu dinero.
          </h1>
          <p className="mt-4 text-muted">
            Registra ingresos de Uber en segundos, controla tus gastos y entiende tus
            hábitos con análisis claros e inteligentes.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: TrendingUp, text: 'Registro de movimientos en menos de 10s' },
              { icon: PieChart, text: 'Dashboard con KPIs y gráficos interactivos' },
              { icon: ShieldCheck, text: 'Tus datos seguros y sincronizados en la nube' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-content">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface text-primary">
                  <f.icon size={16} />
                </span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-subtle">© {new Date().getFullYear()} Finzo</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-contrast">
              <Wallet size={22} strokeWidth={2.4} />
            </span>
            <span className="font-display text-2xl font-bold">Finzo</span>
          </div>

          <h2 className="font-display text-2xl font-bold">
            {mode === 'signin' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === 'signin'
              ? 'Ingresa para continuar con tus finanzas'
              : 'Empieza a controlar tus ingresos y gastos'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'signin' ? (
                'Iniciar sesión'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold text-primary hover:underline"
            >
              {mode === 'signin' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
