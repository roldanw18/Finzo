import {
  LayoutDashboard,
  ChartColumnBig,
  History,
  Tags,
  Settings,
  Target,
  PiggyBank,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Shown in the mobile bottom bar (max 5). */
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, primary: true },
  { to: '/plan', label: 'Plan', icon: Target, primary: true },
  { to: '/analisis', label: 'Análisis', icon: ChartColumnBig, primary: true },
  { to: '/historial', label: 'Historial', icon: History, primary: true },
  { to: '/ahorro', label: 'Ahorro', icon: PiggyBank },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/reporte', label: 'Reporte', icon: FileText },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, primary: true },
]

/** Shown directly in the mobile bottom bar. */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((n) => n.primary)

/** Reachable on mobile through the "Más" sheet (not in the bottom bar). */
export const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((n) => !n.primary)
