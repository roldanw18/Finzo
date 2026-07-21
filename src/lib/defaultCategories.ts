import { activityPreset } from '@/config/activities'

/**
 * Generic seed categories for a brand-new account. The setup wizard then adds
 * the ones specific to the user's occupation (fuel, supplies, stock…).
 */
export const DEFAULT_CATEGORIES = activityPreset('other').categories
