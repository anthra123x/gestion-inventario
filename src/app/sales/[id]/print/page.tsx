'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSaleById } from '@/modules/sales/sales.actions'
import { PaymentMethod } from '@prisma/client'
import { Printer, X, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import styles from './print.module.css'

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  }
  return labels[method] || method
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function SalePrintPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSale()
  }, [params.id])

  async function loadSale() {
    try {
      const data = await getSaleById(params.id as string)
      setSale(data)
    } catch (err: any) {
      setError('Error al cargar la venta')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleClose() {
    router.push('/sales')
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Cargando factura...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.errorText}>{error || 'Venta no encontrada'}</p>
        <button onClick={handleClose} className={styles.backButton}>
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>
      </div>
    )
  }

  const clientData = sale.client || {
    name: sale.clientName || 'Cliente',
    phone: sale.clientPhone || '',
    email: sale.clientEmail || '',
    address: sale.clientAddress || '',
  }

  const subtotal = sale.saleItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
  const discountAmount = sale.discountAmount || (sale.discountPercent > 0 ? subtotal * (sale.discountPercent / 100) : 0)

  return (
    <div className={styles.printWrapper}>
      {/* Action Buttons - Hidden in Print */}
      <div className={styles.actions}>
        <button onClick={handlePrint} className={styles.printButton}>
          <Printer size={18} />
          <span>Imprimir</span>
        </button>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={18} />
        </button>
      </div>

      {/* Invoice Document */}
      <div className={styles.invoice}>
        {/* Invoice Header */}
        <header className={styles.header}>
          <div className={styles.companySection}>
            <h1 className={styles.companyName}>TECHNICELL</h1>
            <p className={styles.companyTagline}>Servicio Técnico Especializado</p>
          </div>
          <div className={styles.invoiceInfo}>
            <div className={styles.invoiceTitle}>FACTURA</div>
            <div className={styles.invoiceNumber}>#{sale.id.slice(-6).toUpperCase()}</div>
            <div className={styles.invoiceDate}>{formatDate(new Date(sale.createdAt))}</div>
          </div>
        </header>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Client & Payment Info */}
        <section className={styles.clientSection}>
          <div className={styles.clientInfo}>
            <h3 className={styles.sectionLabel}>CLIENTE</h3>
            <p className={styles.clientName}>{clientData.name}</p>
            {clientData.phone && <p className={styles.clientDetail}>{clientData.phone}</p>}
            {clientData.email && <p className={styles.clientDetail}>{clientData.email}</p>}
            {clientData.address && <p className={styles.clientDetail}>{clientData.address}</p>}
          </div>
          <div className={styles.paymentInfo}>
            <h3 className={styles.sectionLabel}>PAGO</h3>
            <span className={styles.paymentBadge}>{getPaymentMethodLabel(sale.paymentMethod)}</span>
          </div>
        </section>

        {/* Products Table */}
        <section className={styles.productsSection}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th className={styles.thProduct}>Producto</th>
                <th className={styles.thQty}>Cant.</th>
                <th className={styles.thPrice}>Precio</th>
                <th className={styles.thTotal}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.saleItems.map((item: any) => (
                <tr key={item.id} className={styles.productRow}>
                  <td className={styles.tdProduct}>{item.product.name}</td>
                  <td className={styles.tdQty}>{item.quantity}</td>
                  <td className={styles.tdPrice}>{formatCurrency(item.unitPrice)}</td>
                  <td className={styles.tdTotal}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className={styles.totalsSection}>
          <div className={styles.totalsTable}>
            <div className={styles.totalsRow}>
              <span className={styles.totalsLabel}>Subtotal</span>
              <span className={styles.totalsValue}>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className={styles.totalsRow + ' ' + styles.discountRow}>
                <span className={styles.totalsLabel}>Descuento ({sale.discountPercent}%)</span>
                <span className={styles.totalsValue + ' ' + styles.discountValue}>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className={styles.totalsRow + ' ' + styles.totalFinalRow}>
              <span className={styles.totalLabel}>TOTAL</span>
              <span className={styles.totalValue}>{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </section>

        {/* Notes */}
        {sale.notes && (
          <section className={styles.notesSection}>
            <h3 className={styles.sectionLabel}>NOTAS</h3>
            <p className={styles.notesText}>{sale.notes}</p>
          </section>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerMessage}>Gracias por su preferencia</p>
          <p className={styles.footerMeta}>
            Tecnicell — Generated {formatDateTime(new Date(sale.createdAt))}
          </p>
        </footer>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .${styles.actions} {
            display: none !important;
          }

          .${styles.printWrapper} {
            background: white !important;
            padding: 0 !important;
          }

          .${styles.invoice} {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 40px !important;
          }
        }

        @media screen and (max-width: 600px) {
          .${styles.invoice} {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}