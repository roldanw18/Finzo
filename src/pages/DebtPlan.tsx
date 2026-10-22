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
import { FixedExpenseForm } from '@/components/debt/FixedExpenseForm'
import { PlanOverview } from '@/components/debt/PlanOverview'
import { DebtsTab } from '@/components/debt/DebtsTab'
import { PaymentsTab } from '@/components/debt/PaymentsTab'
import { FixedTab } from '@/components/debt/FixedTab'
import { SimulatorTab } from '@/components/debt/SimulatorTab'
import { WorkTab } from '@/components/debt/WorkTab'
import { GoalsTab } from '@/components/debt/GoalsTab'
import { CalendarTab } from '@/components/debt/CalendarTab'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

type Tab = 'plan' | 'deudas' | 'pagos' | 'fijos' | 'simulador' | 'trabajo' | 'metas' | 'calendario'

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'deudas', label: 'Deudas' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'fijos', label: 'Fijos' },
  { id: 'simulador', label: 'Simulador' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'metas', label: 'Metas' },
  { id: 'calendario', label: 'Calendario' },
]

const MODAL_TITLES: Record<Exclude<DebtModal['type'], 'none'>, string> = {
  debt: 'Deuda',
  payment: 'Registrar pago',
  goal: 'Meta',
  work: 'Registrar jornada',
  reminder: 'Recordatorio',
  fixed: 'Gasto fijo',
}

// Debt-dependent tabs — hidden until the user adds a debt, so the page isn't
// overwhelming on first visit.
const ADVANCED_TABS: Tab[] = ['pagos', 'simulador', 'trabajo', 'metas']

export function DebtPlan() {
  const { t } = useI18n()
  const debts = useStore((s) => s.debts)
  const hasDebts = debts.length > 0
  const [tab, setTab] = useState<Tab>('plan')
  const [modal, setModal] = useState<DebtModal>({ type: 'none' })
  const close = () => setModal({ type: 'none' })

  const visibleTabs = hasDebts ? TABS : TABS.filter((tb) => !ADVANCED_TABS.includes(tb.id))
  // If the current tab got hidden (e.g. last debt deleted), fall back to Plan.
  const activeTab: Tab = visibleTabs.some((tb) => tb.id === tab) ? tab : 'plan'

  return (
    <DebtModalContext.Provider value={setModal}>
      <PageHeader
        title={t('Plan de Libertad Financiera')}
        subtitle={t('Tu asesor para salir de deudas con el método Avalancha')}
        action={
          <button onClick={() => setModal({ type: 'debt' })} className="btn-primary">
            <Plus size={16} /> {t('Deuda')}
          </button>
        }
      />

      {/* Tabs */}
      <div className="sticky top-14 z-10 -mx-4 mb-5 overflow-x-auto border-b border-border bg-bg/80 px-4 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-xl lg:border lg:bg-surface lg:px-2">
        <div className="flex min-w-max gap-1 py-1.5">
          {visibleTabs.map((tab_) => (
            <button
              key={tab_.id}
              onClick={() => setTab(tab_.id)}
              className={cn(
                'relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab_.id ? 'text-primary-contrast' : 'text-muted hover:text-content',
              )}
            >
              {activeTab === tab_.id && (
                <motion.span
                  layoutId="debt-tab"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                />
              )}
              <span className="relative z-10">{t(tab_.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'plan' && <PlanOverview />}
        {activeTab === 'deudas' && <DebtsTab />}
        {activeTab === 'pagos' && <PaymentsTab />}
        {activeTab === 'fijos' && <FixedTab />}
        {activeTab === 'simulador' && <SimulatorTab />}
        {activeTab === 'trabajo' && <WorkTab />}
        {activeTab === 'metas' && <GoalsTab />}
        {activeTab === 'calendario' && <CalendarTab />}
      </motion.div>

      <Modal
        open={modal.type !== 'none'}
        onClose={close}
        title={modal.type !== 'none' ? t(MODAL_TITLES[modal.type]) : ''}
      >
        {modal.type === 'debt' && <DebtForm editing={modal.editing} onDone={close} />}
        {modal.type === 'payment' && <PaymentForm debtId={modal.debtId} onDone={close} />}
        {modal.type === 'goal' && <GoalForm editing={modal.editing} onDone={close} />}
        {modal.type === 'work' && <WorkSessionForm onDone={close} />}
        {modal.type === 'reminder' && <ReminderForm editing={modal.editing} onDone={close} />}
        {modal.type === 'fixed' && <FixedExpenseForm editing={modal.editing} onDone={close} />}
      </Modal>
    </DebtModalContext.Provider>
  )
}
