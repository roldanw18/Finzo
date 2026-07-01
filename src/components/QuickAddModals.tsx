import { Modal } from './ui/Modal'
import { IncomeForm } from './forms/IncomeForm'
import { ExpenseForm } from './forms/ExpenseForm'
import { CategoryForm } from './forms/CategoryForm'
import { useUI } from '@/store/ui'

const TITLES = {
  income: 'Registrar ingreso',
  expense: 'Registrar gasto',
  category: 'Categoría',
} as const

export function QuickAddModals() {
  const modal = useUI((s) => s.modal)
  const close = useUI((s) => s.closeModal)
  const open = modal.type !== 'none'

  return (
    <Modal
      open={open}
      onClose={close}
      title={modal.type !== 'none' ? TITLES[modal.type] : ''}
    >
      {modal.type === 'income' && <IncomeForm editing={modal.editing} onDone={close} />}
      {modal.type === 'expense' && <ExpenseForm editing={modal.editing} onDone={close} />}
      {modal.type === 'category' && (
        <CategoryForm editing={modal.editing} onDone={close} />
      )}
    </Modal>
  )
}
