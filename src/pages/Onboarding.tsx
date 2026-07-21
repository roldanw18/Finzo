import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { toast } from '@/store/toast'
import { getIcon } from '@/lib/icons'
import { ACTIVITY_PRESETS, type ActivityPreset } from '@/config/activities'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types'

export function Onboarding() {
  const profile = useStore((s) => s.profile)
  const categories = useStore((s) => s.categories)
  const saveProfile = useStore((s) => s.saveProfile)
  const addCategory = useStore((s) => s.addCategory)

  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.display_name ?? '')
  const [activity, setActivity] = useState<ActivityPreset | null>(null)
  const [currency, setCurrency] = useState<Currency>(profile?.currency ?? 'COP')
  const [costFactor, setCostFactor] = useState(1.2)
  const [saving, setSaving] = useState(false)

  function pickActivity(a: ActivityPreset) {
    setActivity(a)
    setCostFactor(a.costFactor)
    setStep(2)
  }

  async function finish() {
    if (!activity) return
    setSaving(true)
    try {
      await saveProfile({
        display_name: name.trim() || null,
        currency,
        activity_type: activity.value,
        income_label: activity.incomeLabel,
        cost_label: activity.costLabel,
        cost_factor: costFactor,
        onboarded: true,
      })
      // Add the occupation's categories that don't exist yet (never removes).
      const existing = new Set(categories.map((c) => c.name.toLowerCase()))
      for (const c of activity.categories) {
        if (existing.has(c.name.toLowerCase())) continue
        await addCategory({ name: c.name, color: c.color, icon: c.icon })
      }
      toast.success('¡Todo listo! 🎉')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Brand + progress */}
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-contrast">
            <Wallet size={22} strokeWidth={2.4} />
          </span>
          <span className="font-display text-2xl font-bold">Finzo</span>
          <div className="ml-auto flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i <= step ? 'w-8 bg-primary' : 'w-4 bg-surface-3',
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- Step 0: welcome + name ---------- */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <h1 className="font-display text-3xl font-bold">Bienvenido 👋</h1>
              <p className="mt-2 text-muted">
                Finzo se adapta a lo que haces. En un minuto lo dejamos a tu medida.
              </p>

              <div className="mt-8">
                <label className="label">¿Cómo te llamas?</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="input text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && setStep(1)}
                />
              </div>

              <button onClick={() => setStep(1)} className="btn-primary mt-6 w-full sm:w-auto">
                Continuar <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ---------- Step 1: activity ---------- */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <h1 className="font-display text-3xl font-bold">
                ¿A qué te dedicas{name ? `, ${name}` : ''}?
              </h1>
              <p className="mt-2 text-muted">
                Con esto ajusto tus categorías, el nombre de tus ingresos y cómo calculo
                tus costos. Podrás cambiarlo cuando quieras.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ACTIVITY_PRESETS.map((a) => {
                  const Icon = getIcon(a.icon)
                  return (
                    <button
                      key={a.value}
                      onClick={() => pickActivity(a)}
                      className="card card-hover flex items-start gap-3 p-4 text-left"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Icon size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-content">
                          {a.emoji} {a.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{a.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button onClick={() => setStep(0)} className="btn-ghost mt-6">
                <ArrowLeft size={16} /> Atrás
              </button>
            </motion.div>
          )}

          {/* ---------- Step 2: currency + cost factor ---------- */}
          {step === 2 && activity && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <h1 className="font-display text-3xl font-bold">Últimos detalles</h1>
              <p className="mt-2 text-muted">
                Configuré tu perfil de <b className="text-content">{activity.label}</b>.
              </p>

              <div className="mt-6 space-y-5">
                <div className="card p-4">
                  <p className="label">Moneda</p>
                  <Segmented
                    value={currency}
                    onChange={setCurrency}
                    options={[
                      { value: 'COP', label: 'Peso (COP)' },
                      { value: 'USD', label: 'Dólar (USD)' },
                    ]}
                  />
                </div>

                <div className="card p-4">
                  <p className="label">
                    ¿Cuánto de lo que ganas se va en {activity.costLabel.toLowerCase()}?
                  </p>
                  <p className="mb-3 text-xs text-muted">
                    Lo uso para decirte cuánto producir al día y que el dinero te quede
                    libre de verdad.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { f: 1.05, l: 'Casi nada (5%)' },
                      { f: 1.15, l: 'Poco (15%)' },
                      { f: 1.3, l: 'Bastante (30%)' },
                      { f: 1.5, l: 'Mucho (50%)' },
                    ].map((o) => (
                      <button
                        key={o.f}
                        onClick={() => setCostFactor(o.f)}
                        className={cn(
                          'chip border px-3 py-1.5 text-xs font-medium transition',
                          costFactor === o.f
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-border bg-surface-2 text-content hover:bg-surface-3',
                        )}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-income/25 bg-income/[0.07] p-4 text-sm">
                  <p className="font-semibold text-content">Voy a crear para ti:</p>
                  <ul className="mt-2 space-y-1 text-muted">
                    <li>• {activity.categories.length} categorías de gasto listas para usar</li>
                    <li>• Tus ingresos se llamarán "{activity.incomeLabel}"</li>
                    <li>• Tus costos variables: "{activity.costLabel}"</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  <ArrowLeft size={16} />
                </button>
                <button onClick={finish} disabled={saving} className="btn-primary flex-1">
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={16} /> Empezar a usar Finzo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
