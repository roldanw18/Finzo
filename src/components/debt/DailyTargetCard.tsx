import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Gauge,
  Fuel,
  Clock,
  Target,
  Repeat,
  Landmark,
  CheckCircle2,
  CalendarClock,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import { useDebt } from '@/hooks/useDebt'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useActivity } from '@/hooks/useActivity'
import { useMoney } from '@/hooks/useMoney'
import { useI18n } from '@/i18n'
import { usePrefs } from '@/store/prefs'
import { applyAvailableToTarget } from '@/lib/debt'
import { DailyTargetConfig } from './DailyTargetConfig'

export function DailyTargetCard() {
  const { dailyTargets: dt } = useDebt()
  const { kpis } = useAnalytics()
  const { costLabel } = useActivity()
  const { money } = useMoney()
  const { t } = useI18n()
  const useAvailable = usePrefs((s) => s.useAvailableInTarget)
  const [config, setConfig] = useState(false)

  if (!dt.hasDebts && !dt.hasFixed) return null

  // Optionally subtract available cash from this cycle's obligations.
  const available = Math.max(0, kpis.available)
  const applied = applyAvailableToTarget(dt, available, useAvailable)
  const r = applied.ratio

  const perDay = dt.totalPerDay * r
  const netPerDay = dt.totalNetPerDay * r
  const gas = Math.max(0, perDay - netPerDay)
  const hours = dt.totalHoursPerDay !== null ? dt.totalHoursPerDay * r : null
  const label = dt.hasFixed ? t('tus gastos fijos + los mínimos de deudas') : t('tus pagos mínimos')
  const covered = perDay <= 0.5
  const coveredByAvailable = useAvailable && applied.fullyCovered

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-income/30 bg-gradient-to-br from-income/[0.10] to-transparent p-5"
    >
      <div className="mb-2 flex items-center gap-2 text-income">
        <Gauge size={18} />
        <span className="text-sm font-semibold uppercase tracking-wide">{t('Meta diaria de ingresos')}</span>
        <button
          onClick={() => setConfig(true)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted transition hover:text-content"
        >
          <SlidersHorizontal size={13} /> {t('Ajustar')}
        </button>
      </div>

      <DailyTargetConfig open={config} onClose={() => setConfig(false)} />

      {covered ? (
        <div>
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-income/12 px-3 py-2 text-income">
            <CheckCircle2 size={18} />
            <p className="text-sm font-semibold">
              {coveredByAvailable
                ? t('Tu dinero disponible cubre tus obligaciones de este ciclo 🎉')
                : t('¡Ya cubriste tus obligaciones de este ciclo! 🎉')}
            </p>
          </div>
          <p className="text-sm text-muted">{t('Para el próximo ciclo, produce cada día')}</p>
          <p className="tnum font-display text-4xl font-bold text-income">
            {money(dt.totalPerDayFull)}
            <span className="ml-1 text-base font-medium text-muted">{t('/día')}</span>
          </p>
          <span className="chip mt-2 bg-warning/12 text-xs font-medium text-warning">
            <Fuel size={12} /> {t('incluye {c} (×{f})').replace('{c}', costLabel.toLowerCase()).replace('{f}', String(dt.costFactor))}
          </span>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted">
            {(dt.workDaysPerWeek < 7
              ? t('Para cubrir {label}, produce cada día que trabajas')
              : t('Para cubrir {label}, produce cada día')
            ).replace('{label}', label)}
          </p>
          <p className="tnum font-display text-4xl font-bold text-income">
            {money(perDay)}
            <span className="ml-1 text-base font-medium text-muted">{t('/día')}</span>
          </p>

          {useAvailable && (
            <p className="mt-1 text-xs text-info">
              <Wallet size={11} className="mb-0.5 mr-1 inline" />
              {t('Ya resté tu disponible ({m}). Te falta {r} en total.')
                .split('{r}')
                .map((seg, i) =>
                  i === 0 ? (
                    seg.replace('{m}', money(available, { compact: true }))
                  ) : (
                    <span key={i}><b className="text-content">{money(applied.remaining)}</b>{seg}</span>
                  ),
                )}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="chip bg-warning/12 text-xs font-medium text-warning">
              <Fuel size={12} /> {t('incluye {c} (×{f})').replace('{c}', costLabel.toLowerCase()).replace('{f}', String(dt.costFactor))}
            </span>
            {dt.workDaysPerWeek < 7 && (
              <span className="chip bg-surface-2 text-xs font-medium text-muted">
                <CalendarClock size={12} /> {dt.workDaysPerWeek} {t('días/sem')}
              </span>
            )}
            {hours !== null && (
              <span className="chip bg-info/12 text-xs font-medium text-info">
                <Clock size={12} /> {t('≈ {h}h/día').replace('{h}', String(Math.ceil(hours)))}
              </span>
            )}
            {dt.nextDueName ? (
              <span className="chip bg-surface-2 text-xs text-muted">
                <CalendarClock size={12} />{' '}
                {(dt.totalDaysToDue === 1 ? t('{name} en {d} día') : t('{name} en {d} días'))
                  .replace('{name}', dt.nextDueName)
                  .replace('{d}', String(dt.totalDaysToDue))}
              </span>
            ) : (
              <span className="chip bg-surface-2 text-xs text-muted">
                {t('{d} días restantes del mes').replace('{d}', String(dt.daysLeftInMonth))}
              </span>
            )}
          </div>

          {/* Breakdown fijos vs deudas (hidden when applying available cash) */}
          {dt.hasFixed && dt.hasDebts && !useAvailable && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-surface-2/60 p-2.5">
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  <Repeat size={11} /> {t('Gastos fijos')}
                </p>
                <p className="tnum text-sm font-semibold text-content">
                  {money(dt.fixedNetPerDay * dt.costFactor, { compact: true })}{t('/día')}
                </p>
              </div>
              <div className="rounded-xl bg-surface-2/60 p-2.5">
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  <Landmark size={11} /> {t('Mínimos deudas')}
                </p>
                <p className="tnum text-sm font-semibold text-content">
                  {money(dt.allNetPerDay * dt.costFactor, { compact: true })}{t('/día')}
                </p>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            {t('De eso, {g} es {c} y te queda libre {n}/día para tus obligaciones.')
              .split(/(\{g\}|\{n\})/)
              .map((seg, i) =>
                seg === '{g}' ? (
                  <b key={i} className="text-content">{money(gas, { compact: true })}</b>
                ) : seg === '{n}' ? (
                  <b key={i} className="text-content">{money(netPerDay, { compact: true })}{t('/día')}</b>
                ) : (
                  <span key={i}>{seg.replace('{c}', costLabel.toLowerCase())}</span>
                ),
              )}
          </p>
        </div>
      )}

      {/* Secondary targets */}
      {dt.hasDebts && !useAvailable && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> {t('Solo tarjetas')}
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.cardPerDay)}{t('/día')}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> {t('Ritmo objetivo (deudas)')}
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.targetPerDay)}{t('/día')}</p>
          </div>
        </div>
      )}

      {dt.hasFixed && (
        <p className="mt-3 text-[11px] text-subtle">
          {t('Gastos fijos del mes: {m} · configúralos en la pestaña Fijos.').replace('{m}', money(dt.fixedTotal))}
        </p>
      )}
    </motion.div>
  )
}
