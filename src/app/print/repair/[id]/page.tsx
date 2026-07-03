'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getRepairById } from '@/modules/repairs/repairs.actions'
import { formatCurrency } from '@/lib/format'
import { getRepairStatusLabel } from '@/lib/labels'

type RepairDetail = NonNullable<Awaited<ReturnType<typeof getRepairById>>>

function TechSheetSkeleton() {
  return (
    <div className="tech-sheet-loading">
      <div className="tech-sheet-spinner" />
      <p className="tech-sheet-loading-text">Generando ficha técnica...</p>
    </div>
  )
}

function TechSheetError({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="tech-sheet-loading">
      <p className="tech-sheet-error">{message}</p>
      <button onClick={onBack} className="tech-sheet-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        <span>Volver a reparaciones</span>
      </button>
    </div>
  )
}

export default function RepairTechSheetPage() {
  const params = useParams()
  const router = useRouter()
  const [repair, setRepair] = useState<RepairDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getRepairById(params.id as string)
        setRepair(data)
      } catch (err) {
        setError('Error al cargar la reparación')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) return <TechSheetSkeleton />
  if (error || !repair) return <TechSheetError message={error || 'Reparación no encontrada'} onBack={() => router.push('/repairs')} />

  const partsTotal = repair.repairParts.reduce((sum, p) => sum + p.total, 0)
  const laborCost = repair.laborCost
  const repairId = repair.id.slice(-6).toUpperCase()

  return (
    <>
      {/* Toolbar */}
      <div className="tech-sheet-toolbar">
        <div className="tech-sheet-toolbar-inner">
          <button onClick={() => router.push('/repairs')} className="tech-sheet-btn tech-sheet-btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Volver
          </button>
          <div className="tech-sheet-toolbar-right">
            <button onClick={() => window.print()} className="tech-sheet-btn tech-sheet-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="tech-sheet-document">
        {/* Outer border frame */}
        <div className="tech-sheet-frame">
          {/* HEADER */}
          <div className="tech-sheet-header">
            <div className="tech-sheet-header-left">
              <div className="tech-sheet-brand-mark" />
              <div>
                <h1 className="tech-sheet-company-name">Gestión Reparaciones</h1>
                <p className="tech-sheet-company-tagline">Centro de Servicio Técnico</p>
              </div>
            </div>
            <div className="tech-sheet-header-right">
              <div className="tech-sheet-doc-badge">FICHA TÉCNICA</div>
              <p className="tech-sheet-doc-ref">#REP-{repairId}</p>
              <p className="tech-sheet-doc-date">
                Emitida: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="tech-sheet-divider" />

          {/* CLIENT + DEVICE row */}
          <div className="tech-sheet-section-row">
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-section-header">
                <span className="tech-sheet-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <h3>Cliente</h3>
              </div>
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Nombre</span>
                <span className="tech-sheet-field-value">{repair.client.name}</span>
              </div>
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Teléfono</span>
                <span className="tech-sheet-field-value">{repair.client.phone || '—'}</span>
              </div>
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Email</span>
                <span className="tech-sheet-field-value">{repair.client.email || '—'}</span>
              </div>
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Dirección</span>
                <span className="tech-sheet-field-value">{repair.client.address || '—'}</span>
              </div>
            </div>
            <div className="tech-sheet-section-divider-v" />
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-section-header">
                <span className="tech-sheet-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                </span>
                <h3>Dispositivo</h3>
              </div>
              <div className="tech-sheet-device-name">{repair.device}</div>
              <div className="tech-sheet-field" style={{ marginTop: 12 }}>
                <span className="tech-sheet-field-label">Estado</span>
                <span className="tech-sheet-field-value tech-sheet-status">{getRepairStatusLabel(repair.status)}</span>
              </div>
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Recibido</span>
                <span className="tech-sheet-field-value">{new Date(repair.dateReceived).toLocaleDateString('es-CO')}</span>
              </div>
              {repair.estimatedDate && (
                <div className="tech-sheet-field">
                  <span className="tech-sheet-field-label">Entrega estimada</span>
                  <span className="tech-sheet-field-value">{new Date(repair.estimatedDate).toLocaleDateString('es-CO')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="tech-sheet-divider" />

          {/* PROBLEM + DIAGNOSIS */}
          <div className="tech-sheet-section-row">
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-section-header">
                <span className="tech-sheet-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                </span>
                <h3>Problema Reportado</h3>
              </div>
              <p className="tech-sheet-text">{repair.problem}</p>
            </div>
            <div className="tech-sheet-section-divider-v" />
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-section-header">
                <span className="tech-sheet-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </span>
                <h3>Diagnóstico Técnico</h3>
              </div>
              <p className="tech-sheet-text">{repair.diagnosis || 'Pendiente de diagnóstico'}</p>
            </div>
          </div>

          {/* PARTS TABLE */}
          {repair.repairParts.length > 0 && (
            <>
              <div className="tech-sheet-divider" />
              <div className="tech-sheet-section">
                <div className="tech-sheet-section-header">
                  <span className="tech-sheet-section-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  </span>
                  <h3>Repuestos Utilizados</h3>
                </div>
                <table className="tech-sheet-table">
                  <thead>
                    <tr>
                      <th className="tech-sheet-th tech-sheet-th-product">Producto</th>
                      <th className="tech-sheet-th tech-sheet-th-qty">Cant.</th>
                      <th className="tech-sheet-th tech-sheet-th-price">Precio Unit.</th>
                      <th className="tech-sheet-th tech-sheet-th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repair.repairParts.map((part, i) => (
                      <tr key={part.id} className={i % 2 === 0 ? 'tech-sheet-tr-even' : 'tech-sheet-tr-odd'}>
                        <td className="tech-sheet-td tech-sheet-td-product">
                          <span className="tech-sheet-product-name">{part.part.name}</span>
                        </td>
                        <td className="tech-sheet-td tech-sheet-td-qty">
                          <span className="tech-sheet-qty-badge">{part.quantity}</span>
                        </td>
                        <td className="tech-sheet-td tech-sheet-td-price">{formatCurrency(part.unitCost)}</td>
                        <td className="tech-sheet-td tech-sheet-td-total">{formatCurrency(part.unitCost * part.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* FINANCIAL SUMMARY */}
          <div className="tech-sheet-divider" />
          <div className="tech-sheet-section">
            <div className="tech-sheet-section-header">
              <span className="tech-sheet-section-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </span>
              <h3>Resumen de Costos</h3>
            </div>
            <div className="tech-sheet-totals">
              <div className="tech-sheet-totals-body">
                {partsTotal > 0 && (
                  <div className="tech-sheet-total-row">
                    <span className="tech-sheet-total-label">Repuestos</span>
                    <span className="tech-sheet-total-amount">{formatCurrency(partsTotal)}</span>
                  </div>
                )}
                <div className="tech-sheet-total-row">
                  <span className="tech-sheet-total-label">Mano de obra</span>
                  <span className="tech-sheet-total-amount">{formatCurrency(laborCost)}</span>
                </div>
                <div className="tech-sheet-total-divider" />
                <div className="tech-sheet-total-row tech-sheet-total-row-final">
                  <span className="tech-sheet-total-label">Total</span>
                  <span className="tech-sheet-total-amount-final">{formatCurrency(repair.laborCost + partsTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES */}
          {repair.notes && (
            <>
              <div className="tech-sheet-divider" />
              <div className="tech-sheet-section">
                <div className="tech-sheet-section-header">
                  <span className="tech-sheet-section-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </span>
                  <h3>Notas para el Cliente</h3>
                </div>
                <p className="tech-sheet-text">{repair.notes}</p>
              </div>
            </>
          )}

          {/* TECHNICIAN + SIGNATURES */}
          <div className="tech-sheet-divider" />
          <div className="tech-sheet-section-row">
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-section-header">
                <span className="tech-sheet-section-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <h3>Técnico Responsable</h3>
              </div>
              <p className="tech-sheet-text" style={{ fontWeight: 600, fontSize: 15 }}>{repair.user?.name || '—'}</p>
            </div>
            <div className="tech-sheet-section-divider-v" />
            <div className="tech-sheet-section tech-sheet-section-half">
              <div className="tech-sheet-field">
                <span className="tech-sheet-field-label">Fecha de entrega</span>
                <span className="tech-sheet-field-value">
                  {repair.dateDelivered
                    ? new Date(repair.dateDelivered).toLocaleDateString('es-CO')
                    : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="tech-sheet-divider" />
          <div className="tech-sheet-signatures">
            <div className="tech-sheet-signature-box">
              <div className="tech-sheet-signature-line" />
              <p className="tech-sheet-signature-label">Firma del Cliente</p>
            </div>
            <div className="tech-sheet-signature-box">
              <div className="tech-sheet-signature-line" />
              <p className="tech-sheet-signature-label">Firma del Técnico</p>
            </div>
          </div>

          {/* WARRANTY */}
          <div className="tech-sheet-warranty">
            <div className="tech-sheet-warranty-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p className="tech-sheet-warranty-title">Garantía</p>
              <p className="tech-sheet-warranty-text">
                Este servicio técnico cuenta con una garantía de 30 días en mano de obra a partir de la fecha de entrega.
                Los repuestos instalados cubren la garantía otorgada por el fabricante. La garantía no cubre daños por mal uso,
                golpes, humedad o manipulación por terceros no autorizados.
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="tech-sheet-footer">
            <p className="tech-sheet-footer-msg">Gestión Reparaciones — Centro de Servicio Técnico</p>
            <p className="tech-sheet-footer-meta">
              Documento generado el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* === LOADING / ERROR === */
        .tech-sheet-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: #f4f4f5;
        }
        .tech-sheet-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e5e5e5;
          border-top-color: #1a1a1a;
          border-radius: 50%;
          animation: tech-spin 0.7s linear infinite;
        }
        @keyframes tech-spin {
          to { transform: rotate(360deg); }
        }
        .tech-sheet-loading-text {
          font-size: 14px;
          color: #666;
        }
        .tech-sheet-error {
          font-size: 14px;
          color: #dc2626;
          margin: 0 0 16px;
        }
        .tech-sheet-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          color: #333;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }
        .tech-sheet-back-btn:hover {
          background: #f5f5f5;
        }

        /* === TOOLBAR === */
        .tech-sheet-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid #e5e5e5;
        }
        .tech-sheet-toolbar-inner {
          max-width: 840px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tech-sheet-toolbar-right {
          display: flex;
          gap: 8px;
        }
        .tech-sheet-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          border: none;
        }
        .tech-sheet-btn-primary {
          background: #1a1a1a;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .tech-sheet-btn-primary:hover {
          background: #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }
        .tech-sheet-btn-ghost {
          background: transparent;
          color: #555;
        }
        .tech-sheet-btn-ghost:hover {
          background: #f0f0f0;
          color: #1a1a1a;
        }

        /* === DOCUMENT === */
        .tech-sheet-document {
          padding: 80px 20px 40px;
          min-height: 100vh;
          background: #f4f4f5;
          display: flex;
          justify-content: center;
        }
        .tech-sheet-frame {
          max-width: 800px;
          width: 100%;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
          padding: 0;
        }

        /* === HEADER === */
        .tech-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 40px 48px 28px;
        }
        .tech-sheet-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .tech-sheet-brand-mark {
          width: 44px;
          height: 44px;
          background: #1a1a1a;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .tech-sheet-company-name {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: 1.5px;
          margin: 0;
          line-height: 1.2;
        }
        .tech-sheet-company-tagline {
          font-size: 12px;
          color: #999;
          margin: 2px 0 0;
          letter-spacing: 0.3px;
        }
        .tech-sheet-header-right {
          text-align: right;
        }
        .tech-sheet-doc-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #666;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 4px 12px;
          border: 1px solid #d4d4d4;
          border-radius: 4px;
          background: #fafafa;
        }
        .tech-sheet-doc-ref {
          font-size: 22px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 8px 0 4px;
          letter-spacing: 0.5px;
        }
        .tech-sheet-doc-date {
          font-size: 12px;
          color: #999;
          margin: 0;
        }

        .tech-sheet-divider {
          height: 1px;
          background: #e5e5e5;
          margin: 0 48px;
        }

        /* === SECTIONS === */
        .tech-sheet-section-row {
          display: flex;
        }
        .tech-sheet-section {
          padding: 28px 48px;
        }
        .tech-sheet-section-half {
          flex: 1;
          padding: 28px 48px;
        }
        .tech-sheet-section-divider-v {
          width: 1px;
          background: #e5e5e5;
          flex-shrink: 0;
        }
        .tech-sheet-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .tech-sheet-section-header h3 {
          font-size: 11px;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin: 0;
        }
        .tech-sheet-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #f0f0f0;
          color: #666;
          flex-shrink: 0;
        }

        .tech-sheet-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 8px;
        }
        .tech-sheet-field:last-child {
          margin-bottom: 0;
        }
        .tech-sheet-field-label {
          font-size: 10px;
          font-weight: 600;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .tech-sheet-field-value {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }
        .tech-sheet-device-name {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
        }
        .tech-sheet-text {
          font-size: 14px;
          color: #444;
          margin: 0;
          line-height: 1.6;
        }
        .tech-sheet-status {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          background: #f0f0f0;
          font-size: 13px;
          font-weight: 600;
        }

        /* === TABLE === */
        .tech-sheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .tech-sheet-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 2px solid #1a1a1a;
        }
        .tech-sheet-th-qty,
        .tech-sheet-th-price,
        .tech-sheet-th-total {
          text-align: right;
        }
        .tech-sheet-th-qty { width: 64px; }
        .tech-sheet-th-price { width: 120px; }
        .tech-sheet-th-total { width: 130px; }
        .tech-sheet-tr-even { background: #fafafa; }
        .tech-sheet-tr-odd { background: white; }
        .tech-sheet-td {
          padding: 14px 16px;
          vertical-align: middle;
          border-bottom: 1px solid #f0f0f0;
        }
        .tech-sheet-td-qty,
        .tech-sheet-td-price,
        .tech-sheet-td-total {
          text-align: right;
        }
        .tech-sheet-td-price { color: #666; }
        .tech-sheet-td-total {
          font-weight: 600;
          color: #1a1a1a;
        }
        .tech-sheet-product-name {
          font-weight: 500;
          color: #1a1a1a;
        }
        .tech-sheet-qty-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 26px;
          padding: 0 8px;
          border-radius: 4px;
          background: #eee;
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* === TOTALS === */
        .tech-sheet-totals {
          display: flex;
          justify-content: flex-end;
        }
        .tech-sheet-totals-body {
          width: 300px;
        }
        .tech-sheet-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }
        .tech-sheet-total-label {
          font-size: 14px;
          color: #666;
        }
        .tech-sheet-total-amount {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
        }
        .tech-sheet-total-divider {
          height: 2px;
          background: #1a1a1a;
          margin: 10px 0 12px;
        }
        .tech-sheet-total-row-final {
          padding-top: 4px;
        }
        .tech-sheet-total-row-final .tech-sheet-total-label {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          text-transform: uppercase;
        }
        .tech-sheet-total-amount-final {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
        }

        /* === SIGNATURES === */
        .tech-sheet-signatures {
          display: flex;
          gap: 48px;
          padding: 24px 48px 32px;
        }
        .tech-sheet-signature-box {
          flex: 1;
        }
        .tech-sheet-signature-line {
          border-bottom: 1px solid #1a1a1a;
          height: 40px;
          margin-bottom: 8px;
        }
        .tech-sheet-signature-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0;
          text-align: center;
        }

        /* === WARRANTY === */
        .tech-sheet-warranty {
          display: flex;
          gap: 12px;
          padding: 20px 48px;
          background: #fafafa;
          border-top: 1px solid #e5e5e5;
        }
        .tech-sheet-warranty-icon {
          display: flex;
          align-items: flex-start;
          padding-top: 2px;
          color: #999;
          flex-shrink: 0;
        }
        .tech-sheet-warranty-title {
          font-size: 12px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0 0 6px;
        }
        .tech-sheet-warranty-text {
          font-size: 11px;
          color: #999;
          margin: 0;
          line-height: 1.6;
        }

        /* === FOOTER === */
        .tech-sheet-footer {
          padding: 24px 48px;
          text-align: center;
        }
        .tech-sheet-footer-msg {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px;
        }
        .tech-sheet-footer-meta {
          font-size: 11px;
          color: #bbb;
          margin: 0;
        }

        /* === PRINT === */
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
          .tech-sheet-toolbar {
            display: none !important;
          }
          .tech-sheet-document {
            padding: 0 !important;
            background: white !important;
            min-height: auto !important;
          }
          .tech-sheet-frame {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .tech-sheet-header {
            padding: 32px 40px 24px !important;
          }
          .tech-sheet-divider {
            margin: 0 40px !important;
          }
          .tech-sheet-section {
            padding: 24px 40px !important;
          }
          .tech-sheet-section-half {
            padding: 24px 40px !important;
          }
          .tech-sheet-signatures {
            padding: 20px 40px 28px !important;
          }
          .tech-sheet-warranty {
            padding: 16px 40px !important;
          }
          .tech-sheet-footer {
            padding: 20px 40px !important;
          }
        }

        /* === RESPONSIVE === */
        @media screen and (max-width: 768px) {
          .tech-sheet-document {
            padding: 72px 12px 24px;
          }
          .tech-sheet-header {
            padding: 24px;
            flex-direction: column;
            gap: 16px;
          }
          .tech-sheet-header-right {
            text-align: left;
          }
          .tech-sheet-divider {
            margin: 0 24px;
          }
          .tech-sheet-section {
            padding: 20px 24px;
          }
          .tech-sheet-section-half {
            padding: 20px 24px;
          }
          .tech-sheet-section-row {
            flex-direction: column;
          }
          .tech-sheet-section-divider-v {
            display: none;
          }
          .tech-sheet-totals-body {
            width: 100%;
          }
          .tech-sheet-signatures {
            flex-direction: column;
            gap: 24px;
            padding: 20px 24px;
          }
          .tech-sheet-warranty {
            padding: 16px 24px;
          }
          .tech-sheet-footer {
            padding: 16px 24px;
          }
          .tech-sheet-th-qty,
          .tech-sheet-td-qty {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
