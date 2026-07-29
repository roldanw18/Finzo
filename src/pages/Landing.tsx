import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { useI18n } from '@/i18n'
import { LangSwitch } from '@/components/LangSwitch'
import type { TKey } from '@/i18n/dict'
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

const FEATURES: { icon: typeof TrendingUp; title: TKey; text: TKey }[] = [
  { icon: TrendingUp, title: 'feat.record.title', text: 'feat.record.text' },
  { icon: PieChart, title: 'feat.dashboard.title', text: 'feat.dashboard.text' },
  { icon: Target, title: 'feat.debt.title', text: 'feat.debt.text' },
  { icon: Gauge, title: 'feat.goal.title', text: 'feat.goal.text' },
  { icon: CreditCard, title: 'feat.cards.title', text: 'feat.cards.text' },
  { icon: Smartphone, title: 'feat.pwa.title', text: 'feat.pwa.text' },
]

const OCCUPATIONS: { emoji: string; key: TKey }[] = [
  { emoji: '🚗', key: 'occ.driver' },
  { emoji: '💈', key: 'occ.barber' },
  { emoji: '🛵', key: 'occ.delivery' },
  { emoji: '🏪', key: 'occ.shop' },
  { emoji: '💻', key: 'occ.freelance' },
  { emoji: '💼', key: 'occ.employee' },
]

export function Landing() {
  const enterDemo = useStore((s) => s.enterDemo)
  const { t } = useI18n()
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
            <LangSwitch className="mr-1" />
            <button onClick={() => enterDemo()} className="btn-ghost hidden sm:inline-flex">
              <PlayCircle size={16} /> {t('nav.try')}
            </button>
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">
              {t('nav.login')}
            </Link>
            <Link to="/login?signup=1" className="btn-primary">
              {t('nav.signup')}
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
              <Sparkles size={13} /> {t('hero.badge')}
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t('hero.title.pre')}
              <span className="bg-gradient-to-r from-primary to-income bg-clip-text text-transparent">
                {t('hero.title.highlight')}
              </span>
              .
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">{t('hero.subtitle')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login?signup=1" className="btn-primary px-6 py-3 text-base">
                {t('hero.cta.create')} <ArrowRight size={18} />
              </Link>
              <button onClick={() => enterDemo()} className="btn-outline px-6 py-3 text-base">
                <PlayCircle size={18} /> {t('hero.cta.try')}
              </button>
            </div>
            <p className="mt-2 text-xs text-subtle">{t('hero.demoNote')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-income" /> {t('hero.badge.free')}
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-income" /> {t('hero.badge.noCard')}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-income" /> {t('hero.badge.private')}
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
                  <p className="text-xs text-muted">{t('mockup.available')}</p>
                  <p className="tnum font-display text-3xl font-bold">$2.450.000</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Wallet size={20} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-income/10 p-3">
                  <p className="text-[11px] text-muted">{t('mockup.incomeMonth')}</p>
                  <p className="tnum text-lg font-bold text-income">$4.8M</p>
                </div>
                <div className="rounded-xl bg-expense/10 p-3">
                  <p className="text-[11px] text-muted">{t('mockup.expenseMonth')}</p>
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
                  <p className="text-[11px] text-muted">{t('mockup.dailyGoal')}</p>
                  <p className="tnum text-sm font-bold text-income">$92.000/día</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Occupations strip */}
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <p className="mb-3 text-center text-xs uppercase tracking-widest text-subtle">
            {t('occ.title')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {OCCUPATIONS.map((o) => (
              <span key={o.key} className="chip border border-border bg-surface text-sm text-muted">
                {o.emoji} {t(o.key)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('features.title')}</h2>
          <p className="mt-3 text-muted">{t('features.subtitle')}</p>
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
              <h3 className="mt-4 font-display text-lg font-semibold">{t(f.title)}</h3>
              <p className="mt-1.5 text-sm text-muted">{t(f.text)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-bg-soft">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            {t('how.title')}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {([
              { n: 1, t: 'how.step1.title', d: 'how.step1.text' },
              { n: 2, t: 'how.step2.title', d: 'how.step2.text' },
              { n: 3, t: 'how.step3.title', d: 'how.step3.text' },
            ] as const).map((s) => (
              <div key={s.n} className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-contrast">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(s.t)}</h3>
                <p className="mt-1.5 text-sm text-muted">{t(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('cta.title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t('cta.subtitle')}</p>
        <Link to="/login?signup=1" className="btn-primary mt-8 px-8 py-3.5 text-base">
          {t('cta.button')} <ArrowRight size={18} />
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
          <p className="text-xs text-subtle">© {new Date().getFullYear()} Finzo · {t('footer.tagline')}</p>
        </div>
      </footer>
    </div>
  )
}
