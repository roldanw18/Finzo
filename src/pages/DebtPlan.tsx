import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { DebtModalContext, type DebtModal } from '@/components/debt/modalContext'
import { DebtForm } from '@/components/debt/DebtForm'
import { PaymentForm } from '@/components/debt/PaymentForm'
import { GoalForm } from '@/components/debt/GoalForm'
import { WorkSessionForm } from '@/components/debt/WorkSessionForm'
import { ReminderForm } from '@/components/debt/ReminderForm'
import { PlanOverview } from '@/components/debt/PlanOverview'
import { DebtsTab } from '@/components/debt/DebtsTab'
import { PaymentsTab } from '@/components/debt/PaymentsTab'
import { SimulatorTab } from '@/components/debt/SimulatorTab'
import { UberTab } from '@/components/debt/UberTab'
import { GoalsTab } from '@/components/debt/GoalsTab'
import { CalendarTab } from '@/components/debt/CalendarTab'
import { cn } from '@/lib/utils'

type Tab = 'plan' | 'deudas' | 'pagos' | 'simulador' | 'uber' | 'metas' | 'calendario'

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'simulador', label: 'Simulador' },
  { id: 'uber', label: 'Uber' },
  { id: 'metas', label: 'Metas' },
  { id: 'calendario', label: 'Calendario' },
]

const MODAL_TITLES: Record<Exclude<DebtModal['type'], 'none'>, string> = {
  debt: 'Deuda',
  payment: 'Registrar pago',
  goal: 'Meta',
  work: 'Registrar jornada de Uber',
  reminder: 'Recordatorio',
}

export function DebtPlan() {
  const mode = useStore((s) => s.mode)
  const [tab, setTab] = useState<Tab>('plan')
  const [modal, setModal] = useState<DebtModal>({ type: 'none' })
  const close = () => setModal({ type: 'none' })

  return (
    <DebtModalContext.Provider value={setModal}>
      <PageHeader
        title="Plan de Libertad Financiera"
        subtitle="Tu asesor para salir de deudas con el método Avalancha"
        action={
          <button onClick={() => setModal({ type: 'debt' })} className="btn-primary">
            <Plus size={16} /> Deuda
          </button>
        }
      />

      {/* Tabs */}
      <div className="sticky top-14 z-10 -mx-4 mb-5 overflow-x-auto border-b border-border bg-bg/80 px-4 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-xl lg:border lg:bg-surface lg:px-2">
        <div className="flex min-w-max gap-1 py-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === t.id ? 'text-primary-contrast' : 'text-muted hover:text-content',
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="debt-tab"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'remote' && (
        <p className="mb-4 rounded-xl border border-info/25 bg-info/10 px-3.5 py-2 text-xs text-info">
          Si es tu primera vez aquí y algo no guarda, ejecuta la migración{' '}
          <code>0003_debt_plan.sql</code> en Supabase (SQL Editor).
        </p>
      )}

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'plan' && <PlanOverview />}
        {tab === 'deudas' && <DebtsTab />}
        {tab === 'pagos' && <PaymentsTab />}
        {tab === 'simulador' && <SimulatorTab />}
        {tab === 'uber' && <UberTab />}
        {tab === 'metas' && <GoalsTab />}
        {tab === 'calendario' && <CalendarTab />}
      </motion.div>

      <Modal
        open={modal.type !== 'none'}
        onClose={close}
        title={modal.type !== 'none' ? MODAL_TITLES[modal.type] : ''}
      >
        {modal.type === 'debt' && <DebtForm editing={modal.editing} onDone={close} />}
        {modal.type === 'payment' && <PaymentForm debtId={modal.debtId} onDone={close} />}
        {modal.type === 'goal' && <GoalForm editing={modal.editing} onDone={close} />}
        {modal.type === 'work' && <WorkSessionForm onDone={close} />}
        {modal.type === 'reminder' && <ReminderForm editing={modal.editing} onDone={close} />}
      </Modal>
    </DebtModalContext.Provider>
  )
}
