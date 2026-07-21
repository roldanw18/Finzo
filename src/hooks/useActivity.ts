import { useStore } from '@/store/useStore'
import { activityPreset, type ActivityType } from '@/config/activities'

/**
 * Wording and cost model for the user's occupation. Profile values win over
 * the preset defaults, so anyone can rename things to fit their reality.
 */
export function useActivity() {
  const profile = useStore((s) => s.profile)
  const preset = activityPreset(profile?.activity_type as ActivityType | null)

  return {
    preset,
    activityType: (profile?.activity_type ?? null) as ActivityType | null,
    /** e.g. "Viaje", "Servicio", "Venta". */
    incomeLabel: profile?.income_label?.trim() || preset.incomeLabel,
    /** e.g. "Gasolina", "Insumos", "Mercancía". */
    costLabel: profile?.cost_label?.trim() || preset.costLabel,
    /** Multiplier so obligations stay free after the variable cost. */
    costFactor: profile?.cost_factor ?? preset.costFactor,
    workLabel: preset.workLabel,
    icon: preset.icon,
    emoji: preset.emoji,
    vehicle: preset.vehicle,
    onboarded: profile?.onboarded ?? false,
  }
}
