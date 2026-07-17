import {
  Fuel,
  Landmark,
  Receipt,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  Droplets,
  SprayCan,
  TrafficCone,
  Milestone,
  SquareParking,
  ShoppingBag,
  Clapperboard,
  Gamepad2,
  Repeat,
  HeartPulse,
  GraduationCap,
  Home,
  Shapes,
  Car,
  Coffee,
  Pizza,
  Beer,
  Bus,
  Plane,
  Smartphone,
  Wifi,
  Zap,
  Droplet,
  Flame,
  Shirt,
  Dumbbell,
  Baby,
  Dog,
  Gift,
  Plane as Travel,
  PiggyBank,
  CreditCard,
  Banknote,
  Wallet,
  TrendingUp,
  Music,
  Film,
  BookOpen,
  Stethoscope,
  Pill,
  Scissors,
  Hammer,
  Briefcase,
  CircleDollarSign,
  Coins,
  HandCoins,
  Tag,
  Sparkles,
  Cigarette,
  Wine,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  Fuel,
  Landmark,
  Receipt,
  UtensilsCrossed,
  ShoppingCart,
  Wrench,
  Droplets,
  SprayCan,
  TrafficCone,
  Milestone,
  SquareParking,
  ShoppingBag,
  Clapperboard,
  Gamepad2,
  Repeat,
  HeartPulse,
  GraduationCap,
  Home,
  Shapes,
  Car,
  Coffee,
  Pizza,
  Beer,
  Bus,
  Plane,
  Smartphone,
  Wifi,
  Zap,
  Droplet,
  Flame,
  Shirt,
  Dumbbell,
  Baby,
  Dog,
  Gift,
  Travel,
  PiggyBank,
  CreditCard,
  Banknote,
  Wallet,
  TrendingUp,
  Music,
  Film,
  BookOpen,
  Stethoscope,
  Pill,
  Scissors,
  Hammer,
  Briefcase,
  CircleDollarSign,
  Coins,
  HandCoins,
  Tag,
  Sparkles,
  Cigarette,
  Wine,
}

/** Ordered list for the icon picker UI. */
export const ICON_NAMES = Object.keys(ICONS)

export function getIcon(name: string | null | undefined): LucideIcon {
  if (name && ICONS[name]) return ICONS[name]
  return Shapes
}

/** Curated category color palette (works on dark + light). */
export const CATEGORY_COLORS = [
  '#f0b90b', // amber
  '#f6465d', // red
  '#0ecb81', // green
  '#50a0ff', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#fb923c', // orange
  '#14b8a6', // teal
  '#eab308', // yellow
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#22c55e', // emerald
  '#94a3b8', // slate
]
