import { useEffect, useState } from 'react'
import { openWhatsAppChat } from '../utils/whatsapp'

interface WhatsAppButtonProps {
  bookingId: string
  guestWhatsApp: string | null
  userWhatsApp: string | null
}

const WhatsAppButton = ({ bookingId, guestWhatsApp, userWhatsApp }: WhatsAppButtonProps) => {
  const [copied, setCopied] = useState(false)
  
  const whatsappNumber = guestWhatsApp || userWhatsApp
  const hasWhatsApp = Boolean(whatsappNumber)
  
  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return
    openWhatsAppChat(whatsappNumber, bookingId)
  }
  
  const handleCopyNumber = async () => {
    if (!whatsappNumber) return
    
    try {
      await navigator.clipboard.writeText(whatsappNumber)
      setCopied(true)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (!copied) return
    
    const timeoutId = setTimeout(() => {
      setCopied(false)
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [copied])
  
  return (
    <div className="whatsapp-actions">
      <button
        type="button"
        className="whatsapp-button"
        onClick={handleWhatsAppClick}
        disabled={!hasWhatsApp}
        title={hasWhatsApp ? 'Ouvrir WhatsApp' : 'Aucun numéro WhatsApp disponible'}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ marginRight: '6px' }}
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        WhatsApp
      </button>
      
      <button
        type="button"
        className="copy-button"
        onClick={handleCopyNumber}
        disabled={!hasWhatsApp}
        title={hasWhatsApp ? 'Copier le numéro' : 'Aucun numéro disponible'}
      >
        {copied ? '✓ Copié' : '📋 Copier le numéro'}
      </button>
      
      <style>{`
        .whatsapp-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .whatsapp-button {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          background: #25D366;
          color: white;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }
        
        .whatsapp-button:hover:not(:disabled) {
          background: #20BA5A;
        }
        
        .whatsapp-button:disabled {
          background: #d1d5db;
          color: #6b7280;
          cursor: not-allowed;
        }
        
        .copy-button {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: white;
          color: #111827;
          cursor: pointer;
          font-size: 14px;
        }
        
        .copy-button:hover:not(:disabled) {
          background: #f3f4f6;
        }
        
        .copy-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default WhatsAppButton
