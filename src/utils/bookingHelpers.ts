/**
 * Helper functions for booking state management
 */

export interface ActionableBooking {
  myGoState?: 'OnRequest' | 'Validated' | 'Cancelled'
  wallet_insufficient?: boolean
}

/**
 * Check if a booking requires immediate action
 */
export function isActionableBooking(booking: ActionableBooking): boolean {
  return booking.myGoState === 'OnRequest' || booking.wallet_insufficient === true
}

/**
 * Get display label for actionable bookings
 */
export function getActionableLabel(booking: ActionableBooking): string {
  if (booking.wallet_insufficient && booking.myGoState === 'OnRequest') {
    return '🔴 OnRequest + Crédit Insuffisant'
  }
  if (booking.wallet_insufficient) {
    return '🔴 Crédit Insuffisant'
  }
  if (booking.myGoState === 'OnRequest') {
    return '🟡 OnRequest'
  }
  return ''
}

/**
 * Get alert message for actionable booking detail page
 */
export function getActionableAlertMessage(booking: ActionableBooking): string {
  if (booking.wallet_insufficient && booking.myGoState === 'OnRequest') {
    return 'Cette réservation est en attente (OnRequest) ET le crédit myGO est insuffisant. Veuillez recharger le crédit et rafraîchir le statut.'
  }
  if (booking.wallet_insufficient) {
    return 'Le crédit myGO était insuffisant lors de la tentative de création de cette réservation. Veuillez recharger le crédit et rafraîchir le statut.'
  }
  if (booking.myGoState === 'OnRequest') {
    return 'Cette réservation est en attente de validation par myGO. Vous pouvez rafraîchir le statut ou annuler la réservation si nécessaire.'
  }
  return ''
}
