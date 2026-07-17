import { motion } from 'framer-motion'
import { Gauge, Fuel, Clock, CheckCircle2, Target } from 'lucide-react'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'

export function DailyTargetCard() {
  const { dailyTargets: dt } = useDebt()
  const { money } = useMoney()

  if (!dt.hasDebts) return null

  const primary = dt.hasCards
    ? {
        remaining: dt.cardRemaining,
        perDay: dt.cardPerDay,
        netPerDay: dt.cardNetPerDay,
        daysToDue: dt.cardDaysToDue,
        label: 'el mínimo de tus tarjetas',
      }
    : {
        remaining: dt.allRemaining,
        perDay: dt.allPerDay,
        netPerDay: dt.allNetPerDay,
        daysToDue: dt.allDaysToDue,
        label: 'tus pagos mínimos',
      }

  const covered = primary.remaining <= 0.5

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-income/30 bg-gradient-to-br from-income/[0.10] to-transparent p-5"
    >
      <div className="mb-2 flex items-center gap-2 text-income">
        <Gauge size={18} />
        <span className="text-sm font-semibold uppercase tracking-wide">Meta diaria de ingresos</span>
      </div>

      {covered ? (
        <div>
          <div className="flex items-center gap-2 text-income">
            <CheckCircle2 size={22} />
            <p className="font-display text-xl font-bold text-content">
              ¡Ya cubriste {primary.label} este mes! 🎉
            </p>
          </div>
          {dt.targetPerDay > 0 && (
            <p className="mt-2 text-sm text-muted">
              Para tu <b>ritmo objetivo</b> (pagar más que el mínimo), apunta a{' '}
              <b className="text-content">{money(dt.targetPerDay)}/día</b>.
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted">
            Para cubrir {primary.label}, produce cada día
          </p>
          <p className="tnum font-display text-4xl font-bold text-income">
            {money(primary.perDay)}
            <span className="ml-1 text-base font-medium text-muted">/día</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="chip bg-warning/12 text-xs font-medium text-warning">
              <Fuel size={12} /> incluye gasolina (×{dt.fuelFactor})
            </span>
            {dt.cardHoursPerDay !== null && (
              <span className="chip bg-info/12 text-xs font-medium text-info">
                <Clock size={12} /> ≈ {Math.ceil(dt.cardHoursPerDay)}h/día
              </span>
            )}
            <span className="chip bg-surface-2 text-xs text-muted">
              {primary.daysToDue} días para el próximo pago
            </span>
          </div>

          <p className="mt-3 text-xs text-muted">
            De eso, <b className="text-content">{money(primary.perDay - primary.netPerDay, { compact: true })}</b> es
            gasolina y te queda libre el pago de <b className="text-content">{money(primary.netPerDay, { compact: true })}/día</b>{' '}
            para las deudas.
          </p>
        </div>
      )}

      {/* Secondary targets */}
      {dt.hasDebts && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> Todos los mínimos
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.allPerDay)}/día</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> Ritmo objetivo
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.targetPerDay)}/día</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
