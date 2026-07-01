import {
  LayoutDashboard,
  ChartColumnBig,
  History,
  Tags,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/analisis', label: 'Análisis', icon: ChartColumnBig },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]
