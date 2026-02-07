/**
 * Domain for WhatsApp message templates
 */
const DOMAIN = 'hotel.com.tn'

/**
 * Builds a WhatsApp click-to-chat URL with a pre-filled message
 * @param phoneNumber - WhatsApp number (will be cleaned to digits only)
 * @param bookingId - The booking ID to include in the message
 * @returns WhatsApp click-to-chat URL
 */
export const buildWhatsAppUrl = (phoneNumber: string, bookingId: string): string => {
  // Strip + prefix and keep only digits
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  
  // Build message template in French
  const message = `Bonjour, nous vous contactons au sujet de votre réservation %23${bookingId} sur ${DOMAIN}.`
  const encodedMessage = encodeURIComponent(message)
  
  // Build WhatsApp click-to-chat URL
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`
}

/**
 * Opens WhatsApp click-to-chat in a new tab
 * @param phoneNumber - WhatsApp number
 * @param bookingId - The booking ID to include in the message
 */
export const openWhatsAppChat = (phoneNumber: string, bookingId: string): void => {
  const url = buildWhatsAppUrl(phoneNumber, bookingId)
  window.open(url, '_blank', 'noopener,noreferrer')
}
