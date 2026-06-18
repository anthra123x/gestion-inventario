'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  repairId: string
  phone: string | null
  clientName: string
}

export function WhatsAppButton({ repairId, phone, clientName }: WhatsAppButtonProps) {
  const handleClick = async () => {
    if (!phone) return

    try {
      const response = await fetch(`/api/print/repair/${repairId}/pdf`)
      if (!response.ok) throw new Error('Error al generar el PDF')
      const blob = await response.blob()

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      if (isMobile && navigator.share) {
        try {
          const file = new File([blob], `ficha-tecnica-${repairId.slice(-6)}.pdf`, { type: 'application/pdf' })
          await navigator.share({ files: [file], title: `Ficha Técnica - ${clientName}` })
          return
        } catch {
          // user cancelled or share API not available — fall through
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ficha-tecnica-${repairId.slice(-6)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const cleanPhone = phone.replace(/\D/g, '')
      const fullNumber = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
      const message = `🧰 *Ficha Técnica - ${clientName}*\n\nAdjunto: Ficha técnica de reparación.`
      window.open(`https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`, '_blank')
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error)
    }
  }

  if (!phone) {
    return (
      <Button variant="outline" disabled title="Cliente sin teléfono registrado">
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <MessageCircle className="mr-2 h-4 w-4" />
      WhatsApp
    </Button>
  )
}
