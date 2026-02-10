/**
 * MyGO Credit Monitoring Thresholds
 * 
 * These thresholds determine when to display alerts for low wallet credit.
 * Values are in base currency units (typically TND).
 * 
 * Documented in: docs/ADMIN_OPERATIONS.md
 */

export const CREDIT_THRESHOLDS = {
  /** Credit below this level triggers critical alert (red) */
  CRITICAL: 500,
  
  /** Credit below this level triggers low alert (yellow) */
  LOW: 1000,
} as const

export type CreditStatus = 'critical' | 'low' | 'adequate' | 'unknown'

/**
 * Determine credit status based on remaining deposit
 */
export function getCreditStatus(remainingDeposit: number | undefined): CreditStatus {
  if (remainingDeposit === undefined) return 'unknown'
  if (remainingDeposit <= CREDIT_THRESHOLDS.CRITICAL) return 'critical'
  if (remainingDeposit <= CREDIT_THRESHOLDS.LOW) return 'low'
  return 'adequate'
}
