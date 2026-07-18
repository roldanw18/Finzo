import { motion } from 'framer-motion'
import { Gauge, Fuel, Clock, Target, Repeat, Landmark, CheckCircle2 } from 'lucide-react'
import { useDebt } from '@/hooks/useDebt'
import { useMoney } from '@/hooks/useMoney'

export function DailyTargetCard() {
  const { dailyTargets: dt } = useDebt()
  const { money } = useMoney()

  if (!dt.hasDebts && !dt.hasFixed) return null

  // Headline = cover everything: fixed expenses + all debt minimums.
  const perDay = dt.totalPerDay
  const netPerDay = dt.totalNetPerDay
  const gas = Math.max(0, perDay - netPerDay)
  const label = dt.hasFixed ? 'tus gastos fijos + los mínimos de deudas' : 'tus pagos mínimos'
  const covered = perDay <= 0.5

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
        <div className="flex items-center gap-2 text-income">
          <CheckCircle2 size={22} />
          <p className="font-display text-xl font-bold text-content">
            ¡Ya cubriste tus obligaciones de este mes! 🎉
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted">Para cubrir {label}, produce cada día</p>
          <p className="tnum font-display text-4xl font-bold text-income">
            {money(perDay)}
            <span className="ml-1 text-base font-medium text-muted">/día</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="chip bg-warning/12 text-xs font-medium text-warning">
              <Fuel size={12} /> incluye gasolina (×{dt.fuelFactor})
            </span>
            {dt.totalHoursPerDay !== null && (
              <span className="chip bg-info/12 text-xs font-medium text-info">
                <Clock size={12} /> ≈ {Math.ceil(dt.totalHoursPerDay)}h/día
              </span>
            )}
            <span className="chip bg-surface-2 text-xs text-muted">
              {dt.totalDaysToDue} días para el próximo pago
            </span>
          </div>

          {/* Breakdown fijos vs deudas */}
          {dt.hasFixed && dt.hasDebts && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-surface-2/60 p-2.5">
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  <Repeat size={11} /> Gastos fijos
                </p>
                <p className="tnum text-sm font-semibold text-content">
                  {money(dt.fixedNetPerDay * dt.fuelFactor, { compact: true })}/día
                </p>
              </div>
              <div className="rounded-xl bg-surface-2/60 p-2.5">
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  <Landmark size={11} /> Mínimos deudas
                </p>
                <p className="tnum text-sm font-semibold text-content">
                  {money(dt.allNetPerDay * dt.fuelFactor, { compact: true })}/día
                </p>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-muted">
            De eso, <b className="text-content">{money(gas, { compact: true })}</b> es gasolina y te
            queda libre <b className="text-content">{money(netPerDay, { compact: true })}/día</b> para tus
            obligaciones.
          </p>
        </div>
      )}

      {/* Secondary targets */}
      {dt.hasDebts && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> Solo tarjetas
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.cardPerDay)}/día</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Target size={11} /> Ritmo objetivo (deudas)
            </p>
            <p className="tnum text-sm font-semibold text-content">{money(dt.targetPerDay)}/día</p>
          </div>
        </div>
      )}

      {dt.hasFixed && (
        <p className="mt-3 text-[11px] text-subtle">
          Gastos fijos del mes: {money(dt.fixedTotal)} · configúralos en la pestaña <b>Fijos</b>.
        </p>
      )}
    </motion.div>
  )
}
