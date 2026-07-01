import { FileText, FileSpreadsheet } from 'lucide-react'
import { exportPdf, exportExcel } from '@/lib/exporters'
import { useMoney } from '@/hooks/useMoney'
import { toast } from '@/store/toast'
import type { Movement } from '@/types'
import type { Kpis } from '@/lib/analytics'

interface Props {
  movements: Movement[]
  kpis: Kpis
  title?: string
  periodLabel: string
  compact?: boolean
}

export function ExportButtons({
  movements,
  kpis,
  title = 'Reporte financiero',
  periodLabel,
  compact,
}: Props) {
  const { currency } = useMoney()
  const meta = { title, periodLabel, currency, kpis }

  async function pdf() {
    if (movements.length === 0) return toast.error('No hay movimientos para exportar')
    try {
      await exportPdf(movements, meta)
      toast.success('PDF generado')
    } catch {
      toast.error('No se pudo generar el PDF')
    }
  }
  async function excel() {
    if (movements.length === 0) return toast.error('No hay movimientos para exportar')
    try {
      await exportExcel(movements, meta)
      toast.success('Excel generado')
    } catch {
      toast.error('No se pudo generar el Excel')
    }
  }

  return (
    <div className="flex gap-2">
      <button onClick={pdf} className="btn-outline" title="Exportar PDF">
        <FileText size={16} className="text-expense" />
        {!compact && <span>PDF</span>}
      </button>
      <button onClick={excel} className="btn-outline" title="Exportar Excel">
        <FileSpreadsheet size={16} className="text-income" />
        {!compact && <span>Excel</span>}
      </button>
    </div>
  )
}
