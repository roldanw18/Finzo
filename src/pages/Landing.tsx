import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import {
  Wallet,
  ArrowRight,
  PlayCircle,
  TrendingUp,
  PieChart,
  Target,
  Gauge,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Smartphone,
  Check,
} from 'lucide-react'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Registro en 10 segundos',
    text: 'Anota ingresos y gastos al instante. Categorías, método de pago y notas, sin fricción.',
  },
  {
    icon: PieChart,
    title: 'Dashboard y análisis',
    text: 'KPIs, gráficos interactivos, tendencias y alertas que te dicen dónde se va tu dinero.',
  },
  {
    icon: Target,
    title: 'Plan de deudas (Avalancha)',
    text: 'Sabe cuál atacar primero, simula abonos y proyecta cuándo quedas libre de deudas.',
  },
  {
    icon: Gauge,
    title: 'Meta diaria de ingresos',
    text: 'Cuánto producir al día para cubrir tus obligaciones, contando tus días de descanso.',
  },
  {
    icon: CreditCard,
    title: 'Tarjetas y gastos fijos',
    text: 'Compras a crédito que suman a la deuda sin tocar tu saldo, y control de gastos fijos.',
  },
  {
    icon: Smartphone,
    title: 'Instálala en tu celular',
    text: 'Funciona como app (PWA), con modo oscuro, y sincroniza entre todos tus dispositivos.',
  },
]

const OCCUPATIONS = ['🚗 Conductor', '💈 Barbería', '🛵 Domicilios', '🏪 Negocio', '💻 Freelance', '💼 Empleado']

export function Landing() {
  const enterDemo = useStore((s) => s.enterDemo)
  return (
    <div className="min-h-screen bg-bg text-content">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-contrast">
              <Wallet size={20} strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-bold">Finzo</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => enterDemo()} className="btn-ghost hidden sm:inline-flex">
              <PlayCircle size={16} /> Probar
            </button>
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">
              Iniciar sesión
            </Link>
            <Link to="/login?signup=1" className="btn-primary">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgb(var(--c-primary))' }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-[0.15] blur-3xl"
          style={{ background: 'rgb(var(--c-income))' }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="chip mb-4 bg-primary/10 text-xs font-semibold text-primary">
              <Sparkles size={13} /> Se adapta a tu oficio
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Tus finanzas,{' '}
              <span className="bg-gradient-to-r from-primary to-income bg-clip-text text-transparent">
                bajo control
              </span>
              .
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Controla ingresos y gastos, sal de deudas con un plan claro y sabe cuánto producir al
              día. Pensada para quien vive de su trabajo diario.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login?signup=1" className="btn-primary px-6 py-3 text-base">
                Crear cuenta gratis <ArrowRight size={18} />
              </Link>
              <button onClick={() => enterDemo()} className="btn-outline px-6 py-3 text-base">
                <PlayCircle size={18} /> Probar la app
              </button>
            </div>
            <p className="mt-2 text-xs text-subtle">
              El modo demo carga datos de ejemplo. No necesitas cuenta ni afecta nada.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-income" /> Gratis
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-income" /> Sin tarjeta
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-income" /> Tus datos, privados
              </span>
            </div>
          </motion.div>

          {/* App preview mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-bg-soft p-5 shadow-card-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Dinero disponible</p>
                  <p className="tnum font-display text-3xl font-bold">$2.450.000</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Wallet size={20} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-income/10 p-3">
                  <p className="text-[11px] text-muted">Ingresos mes</p>
                  <p className="tnum text-lg font-bold text-income">$4.8M</p>
                </div>
                <div className="rounded-xl bg-expense/10 p-3">
                  <p className="text-[11px] text-muted">Gastos mes</p>
                  <p className="tnum text-lg font-bold text-expense">$2.3M</p>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-1.5">
                {[40, 65, 50, 80, 55, 90, 70, 100, 60, 85].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                    style={{ minHeight: 6, height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-income/25 bg-income/[0.07] p-3">
                <Gauge size={18} className="text-income" />
                <div>
                  <p className="text-[11px] text-muted">Meta diaria</p>
                  <p className="tnum text-sm font-bold text-income">$92.000/día</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Occupations strip */}
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <p className="mb-3 text-center text-xs uppercase tracking-widest text-subtle">
            Hecha para tu día a día
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {OCCUPATIONS.map((o) => (
              <span key={o} className="chip border border-border bg-surface text-sm text-muted">
                {o}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Todo lo que necesitas</h2>
          <p className="mt-3 text-muted">
            De registrar un gasto en segundos a un plan completo para salir de deudas.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card card-hover p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
                <f.icon size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-bg-soft">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Empieza en 3 pasos
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { n: 1, t: 'Crea tu cuenta', d: 'Regístrate gratis y dinos a qué te dedicas. Configuramos todo por ti.' },
              { n: 2, t: 'Registra tu día', d: 'Ingresos, gastos y tus deudas. En segundos y desde el celular.' },
              { n: 3, t: 'Toma el control', d: 'Mira tu meta diaria, tu plan de deudas y hacia dónde va tu dinero.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-contrast">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Empieza a construir tu libertad financiera hoy
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Gratis, sin tarjeta y en tu idioma. Únete y toma el control de tu dinero.
        </p>
        <Link to="/login?signup=1" className="btn-primary mt-8 px-8 py-3.5 text-base">
          Crear mi cuenta gratis <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-contrast">
              <Wallet size={15} strokeWidth={2.4} />
            </span>
            <span className="font-display font-bold">Finzo</span>
          </div>
          <p className="text-xs text-subtle">© {new Date().getFullYear()} Finzo · Gestión financiera personal</p>
        </div>
      </footer>
    </div>
  )
}
