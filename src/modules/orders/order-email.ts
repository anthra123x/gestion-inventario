import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'Tecnicell Store <notificaciones@tecnicell.store>'

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

function buildEmailHtml(order: {
  id: string
  clientName: string
  status: string
  total: number
  items: { quantity: number; unitPrice: number; total: number; product?: { name: string } }[]
}) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.product?.name || 'Producto'}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">$${item.unitPrice.toLocaleString('es-CO')}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">$${item.total.toLocaleString('es-CO')}</td>
        </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;">
    <tr>
      <td style="background:#059669;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Tecnicell Store</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
        <p style="font-size:16px;margin:0 0 16px;">Hola <strong>${order.clientName}</strong>,</p>
        <p style="font-size:14px;color:#4b5563;margin:0 0 8px;">El estado de tu pedido <strong>#${order.id.slice(-6).toUpperCase()}</strong> ha cambiado a:</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin:16px 0;text-align:center;">
          <span style="font-size:18px;font-weight:bold;color:#059669;">${statusLabels[order.status] || order.status}</span>
        </div>
        <h3 style="font-size:14px;color:#374151;margin:24px 0 8px;">Resumen del pedido</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb;">Producto</th>
              <th style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb;">Cant.</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;">Precio</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="border-top:2px solid #374151;padding:12px 0 0;margin-top:8px;text-align:right;font-size:16px;font-weight:bold;">
          Total: $${order.total.toLocaleString('es-CO')}
        </div>
        <p style="font-size:13px;color:#6b7280;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
          Si tienes preguntas, responde a este correo o contáctanos por WhatsApp.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOrderStatusEmail(order: {
  id: string
  clientName: string
  clientEmail: string | null
  status: string
  total: number
  items: { quantity: number; unitPrice: number; total: number; product?: { name: string } }[]
}) {
  if (!order.clientEmail) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.clientEmail,
      subject: `Pedido #${order.id.slice(-6).toUpperCase()} — ${statusLabels[order.status] || order.status}`,
      html: buildEmailHtml(order),
    })
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
