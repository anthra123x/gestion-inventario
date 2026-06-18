'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSaleById } from '@/modules/sales/sales.actions'
import { Printer, X, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getPaymentMethodLabel } from '@/lib/labels'

type SaleDetail = NonNullable<Awaited<ReturnType<typeof getSaleById>>>

export default function PrintPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSale() {
      try {
        const data = await getSaleById(params.id as string)
        setSale(data)
      } catch (err) {
        setError('Error al cargar la venta')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSale()
  }, [params.id])

  function handlePrint() {
    window.print()
  }

  function handleClose() {
    router.push('/sales')
  }

  if (loading) {
    return (
      <div className="invoice-print-loading">
        <div className="invoice-print-spinner" />
        <p className="invoice-print-loading-text">Cargando factura...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="invoice-print-loading">
        <p className="invoice-print-error">{error || 'Venta no encontrada'}</p>
        <button onClick={handleClose} className="invoice-print-back-btn">
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

  const subtotal = sale.saleItems.reduce((sum: number, item) => sum + item.unitPrice * item.quantity, 0)
  const discountAmount = sale.discountAmount || (sale.discountPercent > 0 ? subtotal * (sale.discountPercent / 100) : 0)

  return (
    <>
      {/* Print Actions - NO PRINT */}
      <div className="invoice-print-actions">
        <button onClick={handlePrint} className="invoice-print-btn invoice-print-btn-primary">
          <Printer size={18} />
          <span>Imprimir</span>
        </button>
        <button onClick={handleClose} className="invoice-print-btn invoice-print-btn-close">
          <X size={18} />
        </button>
      </div>

      {/* Invoice Document */}
      <div className="invoice-document">
        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-company">
            <h1 className="invoice-company-name">Gesti\u00f3n</h1>
          </div>
          <div className="invoice-info">
            <h2 className="invoice-title">FACTURA</h2>
            <p className="invoice-number">#{sale.id.slice(-6).toUpperCase()}</p>
            <p className="invoice-datetime">
              {new Date(sale.createdAt).toLocaleDateString('es-CO')} at{' '}
              {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="invoice-divider" />

        {/* Client Info */}
        <div className="invoice-client">
          <h3 className="invoice-section-title">DATOS DEL CLIENTE</h3>
          <div className="invoice-client-grid">
            <div className="invoice-client-item">
              <p className="invoice-client-label">Nombre</p>
              <p className="invoice-client-value">{clientData.name}</p>
            </div>
            <div className="invoice-client-item">
              <p className="invoice-client-label">Teléfono</p>
              <p className="invoice-client-value">{clientData.phone || '-'}</p>
            </div>
            <div className="invoice-client-item">
              <p className="invoice-client-label">Email</p>
              <p className="invoice-client-value">{clientData.email || '-'}</p>
            </div>
            <div className="invoice-client-item">
              <p className="invoice-client-label">Dirección</p>
              <p className="invoice-client-value">{clientData.address || '-'}</p>
            </div>
          </div>
          <div className="invoice-payment-method">
            <p className="invoice-client-label">Método de Pago</p>
            <p className="invoice-client-value">{getPaymentMethodLabel(sale.paymentMethod)}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="invoice-products">
          <h3 className="invoice-section-title">PRODUCTOS</h3>
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="invoice-th invoice-th-product">Producto</th>
                <th className="invoice-th invoice-th-qty">Cantidad</th>
                <th className="invoice-th invoice-th-price">Precio Unit.</th>
                <th className="invoice-th invoice-th-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.saleItems.map((item) => (
                <tr key={item.id} className="invoice-tr">
                  <td className="invoice-td invoice-td-product">
                    <div>
                      <p className="invoice-product-name">{item.product.name}</p>
                    </div>
                  </td>
                  <td className="invoice-td invoice-td-qty">{item.quantity}</td>
                  <td className="invoice-td invoice-td-price">{formatCurrency(item.unitPrice)}</td>
                  <td className="invoice-td invoice-td-total">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="invoice-totals-content">
            <div className="invoice-totals-row">
              <p className="invoice-totals-label">Subtotal</p>
              <p className="invoice-totals-value">{formatCurrency(subtotal)}</p>
            </div>
            {(sale.discountPercent > 0 || sale.discountAmount > 0) && (
              <div className="invoice-totals-row invoice-totals-discount">
                <p className="invoice-totals-label">Descuento ({sale.discountPercent}%)</p>
                <p className="invoice-totals-value">-{formatCurrency(discountAmount)}</p>
              </div>
            )}
            <div className="invoice-totals-row invoice-totals-final">
              <p className="invoice-totals-label">TOTAL</p>
              <p className="invoice-totals-value invoice-totals-total-value">{formatCurrency(sale.total)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="invoice-notes">
            <h3 className="invoice-section-title">NOTAS</h3>
            <p className="invoice-notes-text">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="invoice-footer">
          <p className="invoice-footer-message">Gracias por su compra</p>
          <p className="invoice-footer-meta">
            Factura generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}
          </p>
          <p className="invoice-footer-brand">Generado por Gesti\u00f3n</p>
        </div>
      </div>

      {/* Print Styles - Only for this document */}
      <style jsx global>{`
        /* Reset for print page */
        .invoice-print-loading,
        .invoice-print-error,
        .invoice-print-back-btn {
          all: revert;
        }

        /* Loading State */
        .invoice-print-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f4f4f5;
          gap: 16px;
          margin: 0;
          padding: 0;
        }

        .invoice-print-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e5e5;
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: invoice-spin 0.8s linear infinite;
        }

        @keyframes invoice-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .invoice-print-loading-text {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .invoice-print-error {
          font-size: 14px;
          color: #dc2626;
          margin: 0 0 16px 0;
        }

        .invoice-print-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          color: #333;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .invoice-print-back-btn:hover {
          background: #f5f5f5;
        }

        /* Action Buttons - Not printed */
        .invoice-print-actions {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 12px;
          z-index: 9999;
        }

        .invoice-print-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invoice-print-btn-primary {
          background: #1a1a1a;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .invoice-print-btn-primary:hover {
          background: #333;
        }

        .invoice-print-btn-close {
          width: 40px;
          height: 40px;
          justify-content: center;
          background: white;
          color: #666;
          border: 1px solid #e5e5e5;
        }

        .invoice-print-btn-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        /* Invoice Document */
        .invoice-document {
          width: 100%;
          max-width: 800px;
          min-height: calc(100vh - 80px);
          background: white;
          margin: 40px auto;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
          padding: 0;
        }

        /* Header */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 48px 48px 32px 48px;
        }

        .invoice-company-name {
          font-size: 32px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: 2px;
          margin: 0;
        }

        .invoice-company-tagline {
          font-size: 14px;
          color: #888;
          margin: 4px 0 0 0;
        }

        .invoice-title {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 0;
        }

        .invoice-number {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 4px 0 0 0;
        }

        .invoice-datetime {
          font-size: 12px;
          color: #999;
          margin: 8px 0 0 0;
        }

        /* Divider */
        .invoice-divider {
          height: 3px;
          background: linear-gradient(90deg, #1a1a1a 0%, #1a1a1a 40%, #e5e5e5 40%, #e5e5e5 100%);
          margin: 0 48px;
        }

        /* Client Section */
        .invoice-client {
          padding: 32px 48px;
          border-bottom: 1px solid #e5e5e5;
        }

        .invoice-section-title {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 0 0 16px 0;
        }

        .invoice-client-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .invoice-client-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .invoice-client-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          margin: 0;
        }

        .invoice-client-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0;
        }

        .invoice-payment-method {
          margin-top: 16px;
        }

        /* Products Table */
        .invoice-products {
          padding: 32px 48px;
          border-bottom: 1px solid #e5e5e5;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .invoice-th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #666;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #1a1a1a;
          background: #fafafa;
        }

        .invoice-th-qty,
        .invoice-th-price,
        .invoice-th-total {
          text-align: right;
        }

        .invoice-th-qty {
          width: 80px;
        }

        .invoice-th-price {
          width: 120px;
        }

        .invoice-th-total {
          width: 140px;
        }

        .invoice-tr {
          border-bottom: 1px solid #f0f0f0;
        }

        .invoice-tr:hover {
          background: #fafafa;
        }

        .invoice-td {
          padding: 16px;
          vertical-align: middle;
        }

        .invoice-td-qty,
        .invoice-td-price,
        .invoice-td-total {
          text-align: right;
        }

        .invoice-td-qty {
          color: #666;
        }

        .invoice-td-price {
          color: #666;
        }

        .invoice-td-total {
          font-weight: 600;
          color: #1a1a1a;
        }

        /* Totals */
        .invoice-totals {
          padding: 32px 48px;
          border-bottom: 1px solid #e5e5e5;
        }

        .invoice-totals-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .invoice-totals-row {
          display: flex;
          justify-content: space-between;
          width: 280px;
          padding: 8px 0;
        }

        .invoice-totals-label {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .invoice-totals-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0;
        }

        .invoice-totals-discount .invoice-totals-label,
        .invoice-totals-discount .invoice-totals-value {
          color: #dc2626;
        }

        .invoice-totals-final {
          border-top: 2px solid #1a1a1a;
          margin-top: 8px;
          padding-top: 16px;
        }

        .invoice-totals-final .invoice-totals-label {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          text-transform: uppercase;
        }

        .invoice-totals-total-value {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
        }

        /* Notes */
        .invoice-notes {
          padding: 24px 48px;
          border-bottom: 1px solid #e5e5e5;
        }

        .invoice-notes-text {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.6;
        }

        /* Footer */
        .invoice-footer {
          padding: 32px 48px;
          background: #fafafa;
          text-align: center;
        }

        .invoice-footer-message {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .invoice-footer-meta {
          font-size: 12px;
          color: #888;
          margin: 8px 0 0 0;
        }

        .invoice-footer-brand {
          font-size: 11px;
          color: #bbb;
          margin: 16px 0 0 0;
        }

        /* PRINT STYLES */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Hide action buttons */
          .invoice-print-actions,
          .invoice-print-btn {
            display: none !important;
          }

          /* Full width invoice */
          .invoice-document {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            min-height: auto !important;
          }

          /* Adjust padding for print */
          .invoice-header,
          .invoice-client,
          .invoice-products,
          .invoice-totals,
          .invoice-notes,
          .invoice-footer {
            padding-left: 32px !important;
            padding-right: 32px !important;
          }

          .invoice-divider {
            margin-left: 32px !important;
            margin-right: 32px !important;
          }
        }

        /* RESPONSIVE - Mobile */
        @media screen and (max-width: 768px) {
          .invoice-print-actions {
            top: 12px;
            right: 12px;
          }

          .invoice-print-btn-primary span {
            display: none;
          }

          .invoice-document {
            margin: 0;
            box-shadow: none;
          }

          .invoice-header {
            padding: 24px;
            flex-direction: column;
            gap: 16px;
          }

          .invoice-company-name {
            font-size: 24px;
          }

          .invoice-divider {
            margin: 0 24px;
          }

          .invoice-client,
          .invoice-products,
          .invoice-totals,
          .invoice-notes,
          .invoice-footer {
            padding: 24px;
          }

          .invoice-client-grid {
            grid-template-columns: 1fr;
          }

          .invoice-table {
            font-size: 12px;
          }

          .invoice-th,
          .invoice-td {
            padding: 10px 8px;
          }

          .invoice-th-product,
          .invoice-td-product {
            max-width: 120px;
          }

          .invoice-totals-content {
            align-items: stretch;
          }

          .invoice-totals-row {
            width: 100%;
          }

          .invoice-totals-total-value {
            font-size: 24px;
          }
        }

        /* Small mobile */
        @media screen and (max-width: 400px) {
          .invoice-header {
            padding: 16px;
          }

          .invoice-divider {
            margin: 0 16px;
          }

          .invoice-client,
          .invoice-products,
          .invoice-totals,
          .invoice-notes,
          .invoice-footer {
            padding: 16px;
          }

          .invoice-th-qty,
          .invoice-td-qty {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
