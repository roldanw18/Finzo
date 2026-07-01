import type { Currency, Movement } from '@/types'
import { paymentMethodLabel } from '@/types'
import { formatMoney } from './utils'
import { fmt } from './dates'
import type { Kpis } from './analytics'

interface ReportMeta {
  title: string
  periodLabel: string
  currency: Currency
  kpis: Kpis
}

const stamp = () => fmt(new Date(), "yyyy-MM-dd_HHmm")

/* ----------------------------------------------------------- PDF */

export async function exportPdf(movements: Movement[], meta: ReportMeta) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const c = meta.currency

  // Header band
  doc.setFillColor(11, 14, 17)
  doc.rect(0, 0, pageWidth, 90, 'F')
  doc.setTextColor(240, 185, 11)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Finzo', 40, 45)
  doc.setTextColor(234, 236, 239)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(meta.title, 40, 66)
  doc.setFontSize(10)
  doc.setTextColor(132, 142, 156)
  doc.text(meta.periodLabel, 40, 80)
  doc.text(`Generado: ${fmt(new Date(), "d 'de' MMMM yyyy")}`, pageWidth - 40, 80, {
    align: 'right',
  })

  // KPI summary cards
  const k = meta.kpis
  const cards: [string, string][] = [
    ['Ingresos del mes', formatMoney(k.monthIncome, c)],
    ['Gastos del mes', formatMoney(k.monthExpense, c)],
    ['Balance del mes', formatMoney(k.monthBalance, c)],
    ['Dinero disponible', formatMoney(k.available, c)],
  ]
  let x = 40
  const cardW = (pageWidth - 80 - 30) / 4
  cards.forEach(([label, value]) => {
    doc.setDrawColor(226, 230, 236)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, 110, cardW, 56, 6, 6, 'FD')
    doc.setFontSize(8)
    doc.setTextColor(120, 130, 145)
    doc.text(label.toUpperCase(), x + 10, 128)
    doc.setFontSize(12)
    doc.setTextColor(20, 26, 35)
    doc.setFont('helvetica', 'bold')
    doc.text(value, x + 10, 150)
    doc.setFont('helvetica', 'normal')
    x += cardW + 10
  })

  // Movements table
  autoTable(doc, {
    startY: 190,
    head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Método', 'Monto']],
    body: movements.map((m) => [
      fmt(m.date, 'dd/MM/yyyy'),
      m.kind === 'income' ? 'Ingreso' : 'Gasto',
      m.categoryName,
      m.title,
      m.paymentMethod ? paymentMethodLabel(m.paymentMethod) : '—',
      `${m.kind === 'income' ? '+' : '-'}${formatMoney(m.amount, c)}`,
    ]),
    styles: { fontSize: 8, cellPadding: 5, lineColor: [235, 238, 242] },
    headStyles: { fillColor: [30, 35, 41], textColor: [240, 185, 11], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 252] },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const isIncome = movements[data.row.index]?.kind === 'income'
        data.cell.styles.textColor = isIncome ? [6, 150, 90] : [210, 45, 65]
      }
    },
  })

  doc.save(`finzo_reporte_${stamp()}.pdf`)
}

/* --------------------------------------------------------- Excel */

export async function exportExcel(movements: Movement[], meta: ReportMeta) {
  const XLSX = await import('xlsx')
  const c = meta.currency
  const wb = XLSX.utils.book_new()

  // Movements sheet
  const rows = movements.map((m) => ({
    Fecha: fmt(m.date, 'yyyy-MM-dd'),
    Tipo: m.kind === 'income' ? 'Ingreso' : 'Gasto',
    Categoría: m.categoryName,
    Descripción: m.title,
    'Método de pago': m.paymentMethod ? paymentMethodLabel(m.paymentMethod) : '',
    Observaciones: m.notes ?? '',
    Monto: m.kind === 'income' ? m.amount : -m.amount,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')

  // Summary sheet
  const k = meta.kpis
  const summary = [
    ['Reporte', meta.title],
    ['Periodo', meta.periodLabel],
    ['Moneda', c],
    [],
    ['Ingresos del mes', k.monthIncome],
    ['Gastos del mes', k.monthExpense],
    ['Balance del mes', k.monthBalance],
    ['Dinero disponible', k.available],
    ['Ahorro acumulado', k.totalSavings],
    ['Promedio diario de gasto', Math.round(k.dailyAvgExpense)],
    ['Tasa de ahorro (%)', Number(k.savingsRate.toFixed(1))],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(summary)
  ws2['!cols'] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen')

  XLSX.writeFile(wb, `finzo_reporte_${stamp()}.xlsx`)
}
