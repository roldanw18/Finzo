import type { SavingsGoal } from '@/types'

/** Calendar days from today until an ISO date (yyyy-MM-dd). Can be negative. */
export function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/**
 * How much to set aside per day for a goal:
 *  - null once the goal is reached (nothing left to save),
 *  - the manual `daily_target` when the user set one (> 0),
 *  - otherwise auto: remaining ÷ days left, if the goal has a future target date,
 *  - null when there's no way to pace it (no manual amount, no upcoming date).
 */
export function dailyTarget(goal: SavingsGoal): number | null {
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount)
  if (remaining === 0) return null
  if (goal.daily_target && goal.daily_target > 0) return goal.daily_target
  if (goal.target_date) {
    const left = daysUntil(goal.target_date)
    if (left >= 0) return Math.ceil(remaining / Math.max(1, left))
  }
  return null
}

export interface SavingsReminder {
  goal: SavingsGoal
  amount: number
}

/** Active goals (not yet reached) that have a daily amount to set aside. */
export function savingsReminders(goals: SavingsGoal[]): SavingsReminder[] {
  return goals
    .map((goal) => ({ goal, amount: dailyTarget(goal) }))
    .filter((r): r is SavingsReminder => r.amount !== null && r.amount > 0)
}

/** Sum of today's daily savings targets across all active goals. */
export function totalDailySavings(goals: SavingsGoal[]): number {
  return savingsReminders(goals).reduce((a, r) => a + r.amount, 0)
}
