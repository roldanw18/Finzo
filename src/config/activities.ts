/**
 * Activity presets — the app adapts its wording, categories and cost model to
 * whatever the user does for a living. Everything here is only a STARTING POINT:
 * the user can rename labels, tweak the cost factor and edit categories later.
 */

export type ActivityType =
  | 'driver'
  | 'barber'
  | 'delivery'
  | 'shop'
  | 'freelance'
  | 'employee'
  | 'other'

export interface CategorySeed {
  name: string
  color: string
  icon: string
}

export interface ActivityPreset {
  value: ActivityType
  /** Shown in the onboarding picker. */
  label: string
  emoji: string
  /** Lucide icon name (must exist in lib/icons.ts). */
  icon: string
  description: string
  /** How income is named, e.g. "Ingreso Uber", "Servicio", "Venta". */
  incomeLabel: string
  /** Plural/section wording for the work log, e.g. "Jornadas", "Turnos". */
  workLabel: string
  /** The variable cost of producing income: fuel, supplies, stock… */
  costLabel: string
  /**
   * Multiplier applied to obligations so that, after paying the variable cost,
   * the money is actually free. 1.3 => earn 30% extra to cover fuel/supplies.
   */
  costFactor: number
  /** Whether vehicle-related reminders make sense (SOAT, oil change…). */
  vehicle: boolean
  categories: CategorySeed[]
}

/** Categories everyone gets, regardless of occupation. */
const COMMON: CategorySeed[] = [
  { name: 'Alimentación', color: '#fb923c', icon: 'UtensilsCrossed' },
  { name: 'Mercado', color: '#0ecb81', icon: 'ShoppingCart' },
  { name: 'Salud', color: '#f43f5e', icon: 'HeartPulse' },
  { name: 'Hogar', color: '#eab308', icon: 'Home' },
  { name: 'Servicios', color: '#50a0ff', icon: 'Zap' },
  { name: 'Transporte', color: '#6366f1', icon: 'Bus' },
  { name: 'Compras', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Entretenimiento', color: '#8b5cf6', icon: 'Clapperboard' },
  { name: 'Suscripciones', color: '#14b8a6', icon: 'Repeat' },
  { name: 'Educación', color: '#22c55e', icon: 'GraduationCap' },
  { name: 'Impuestos', color: '#f6465d', icon: 'Landmark' },
  { name: 'Otros', color: '#94a3b8', icon: 'Shapes' },
]

const VEHICLE: CategorySeed[] = [
  { name: 'Gasolina', color: '#f0b90b', icon: 'Fuel' },
  { name: 'Mantenimiento del vehículo', color: '#50a0ff', icon: 'Wrench' },
  { name: 'Lavado', color: '#06b6d4', icon: 'SprayCan' },
  { name: 'Peajes', color: '#a855f7', icon: 'TrafficCone' },
  { name: 'Parqueaderos', color: '#6366f1', icon: 'SquareParking' },
]

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  {
    value: 'driver',
    icon: 'Car',
    label: 'Conductor / Transporte',
    emoji: '🚗',
    description: 'Uber, taxi, InDriver, transporte particular',
    incomeLabel: 'Viaje',
    workLabel: 'Jornadas',
    costLabel: 'Gasolina',
    costFactor: 1.3,
    vehicle: true,
    categories: [...VEHICLE, ...COMMON],
  },
  {
    value: 'barber',
    icon: 'Scissors',
    label: 'Barbería / Belleza',
    emoji: '💈',
    description: 'Barbero, estilista, manicurista, spa',
    incomeLabel: 'Servicio',
    workLabel: 'Turnos',
    costLabel: 'Insumos',
    costFactor: 1.15,
    vehicle: false,
    categories: [
      { name: 'Insumos y productos', color: '#f0b90b', icon: 'SprayCan' },
      { name: 'Herramientas', color: '#a855f7', icon: 'Scissors' },
      { name: 'Alquiler del puesto', color: '#fb923c', icon: 'Home' },
      { name: 'Publicidad', color: '#ec4899', icon: 'Sparkles' },
      ...COMMON,
    ],
  },
  {
    value: 'delivery',
    icon: 'Bus',
    label: 'Domicilios / Mensajería',
    emoji: '🛵',
    description: 'Rappi, moto, mensajería, paquetería',
    incomeLabel: 'Pedido',
    workLabel: 'Jornadas',
    costLabel: 'Gasolina',
    costFactor: 1.25,
    vehicle: true,
    categories: [...VEHICLE, ...COMMON],
  },
  {
    value: 'shop',
    icon: 'ShoppingCart',
    label: 'Negocio / Tienda',
    emoji: '🏪',
    description: 'Tienda, restaurante, venta de productos',
    incomeLabel: 'Venta',
    workLabel: 'Jornadas',
    costLabel: 'Mercancía',
    costFactor: 1.5,
    vehicle: false,
    categories: [
      { name: 'Mercancía / Inventario', color: '#f0b90b', icon: 'ShoppingCart' },
      { name: 'Arriendo del local', color: '#fb923c', icon: 'Home' },
      { name: 'Empleados', color: '#50a0ff', icon: 'Users' },
      { name: 'Publicidad', color: '#ec4899', icon: 'Sparkles' },
      ...COMMON,
    ],
  },
  {
    value: 'freelance',
    icon: 'Smartphone',
    label: 'Freelance / Independiente',
    emoji: '💻',
    description: 'Diseño, programación, consultoría, oficios',
    incomeLabel: 'Proyecto',
    workLabel: 'Sesiones',
    costLabel: 'Herramientas',
    costFactor: 1.1,
    vehicle: false,
    categories: [
      { name: 'Herramientas y software', color: '#50a0ff', icon: 'Smartphone' },
      { name: 'Internet', color: '#06b6d4', icon: 'Wifi' },
      { name: 'Publicidad', color: '#ec4899', icon: 'Sparkles' },
      ...COMMON,
    ],
  },
  {
    value: 'employee',
    icon: 'Briefcase',
    label: 'Empleado / Salario',
    emoji: '💼',
    description: 'Trabajo con sueldo fijo o por horas',
    incomeLabel: 'Salario',
    workLabel: 'Turnos',
    costLabel: 'Gastos de trabajo',
    costFactor: 1.05,
    vehicle: false,
    categories: [...COMMON],
  },
  {
    value: 'other',
    icon: 'Wallet',
    label: 'Otro',
    emoji: '✨',
    description: 'Configúralo a tu medida',
    incomeLabel: 'Ingreso',
    workLabel: 'Jornadas',
    costLabel: 'Costos',
    costFactor: 1.2,
    vehicle: false,
    categories: [...COMMON],
  },
]

export function activityPreset(type: ActivityType | null | undefined): ActivityPreset {
  return ACTIVITY_PRESETS.find((a) => a.value === type) ?? ACTIVITY_PRESETS[6]
}
