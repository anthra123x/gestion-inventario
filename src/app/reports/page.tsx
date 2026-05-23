'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import * as XLSX from 'xlsx'
import { FileText, Download, Filter, BarChart3, Package, Users, Wrench, TrendingUp, DollarSign, PiggyBank, AlertTriangle, XCircle, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { generateReportData } from '@/modules/reports/reports.actions'
import { getRepairStatusLabel, getStockStatus } from '@/lib/labels'

type SortDir = 'asc' | 'desc'

function SortHeader({ label, sortKey: sk, currentSortKey, currentSortDir, onToggle }: {
  label: string
  sortKey: string
  currentSortKey: string
  currentSortDir: SortDir
  onToggle: (key: string) => void
}) {
  const isActive = currentSortKey === sk
  return (
    <button
      onClick={() => onToggle(sk)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive && (
        currentSortDir === 'asc'
          ? <ChevronUp className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  )
}

function sortData<T>(data: T[], sortKey: string, sortDir: SortDir, fn: (item: T) => number | string): T[] {
  if (!sortKey) return data
  return [...data].sort((a, b) => {
    const va = fn(a)
    const vb = fn(b)
    const cmp = typeof va === 'string'
      ? va.localeCompare(vb as string)
      : (va as number) - (vb as number)
    return sortDir === 'asc' ? cmp : -cmp
  })
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider ${className || ''}`}>{children}</th>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Search className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('sales')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<any>({ status: '', category: '' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  function handleReportChange(value: string) {
    if (value !== selectedReport) {
      setSelectedReport(value)
      setReportData(null)
      setDetailSearch('')
      setSortKey('')
      setSortDir('desc')
    }
  }

  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [detailSearch, setDetailSearch] = useState('')

  async function generateReport() {
    setLoading(true)
    try {
      const reportFilters = {
        ...filters,
        ...(dateRange.startDate && dateRange.endDate && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate + 'T23:59:59'),
        }),
      }
      const data = await generateReportData(selectedReport, reportFilters)
      setReportData(data)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function exportToExcel() {
    if (!reportData) return

    setExportLoading(true)
    try {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      let rows: any[] = []
      let filename = ''

      switch (selectedReport) {
        case 'sales': {
          const salesData = reportData.sales || []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          rows = salesData.map((s: any) => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            const cost = s.saleItems.reduce((sum: number, i: any) => sum + (i.purchasePriceAtSale * i.quantity), 0)
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            const profit = s.saleItems.reduce((sum: number, i: any) => sum + (i.profit || 0), 0)
            return {
              ID: s.id.slice(-8).toUpperCase(),
              Fecha: new Date(s.createdAt).toLocaleDateString('es-CO'),
              Cliente: s.client?.name || s.clientName || 'Ocasional',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
              Productos: s.saleItems.map((i: any) => i.product?.name).join(', '),
              'Método Pago': s.paymentMethod,
              Subtotal: s.total + (s.discountAmount || 0),
              Descuento: s.discountAmount || 0,
              Total: s.total,
              'Costo Invertido': cost,
              Ganancia: profit,
              Vendedor: s.user?.name || 'N/A',
            }
          })
          filename = `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        }
        case 'inventory': {
          const products = reportData.products || []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          rows = products.map((p: any) => ({
            Producto: p.name,
            Categoria: p.category,
            'Stock Actual': p.stock,
            'Stock Mínimo': p.minStock,
            'Costo Compra': p.purchasePrice,
            'Precio Venta': p.salePrice,
            Margen: p.salePrice > 0 ? `${(((p.salePrice - p.purchasePrice) / p.salePrice) * 100).toFixed(1)}%` : '0%',
            'Valor Total': p.stock * p.salePrice,
          }))
          filename = `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        }
        case 'repairs': {
          const repairs = reportData.repairs || []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          rows = repairs.map((r: any) => ({
            ID: r.id.slice(-8).toUpperCase(),
            Fecha: new Date(r.createdAt).toLocaleDateString('es-CO'),
            Cliente: r.client?.name || 'N/A',
            Dispositivo: r.device,
            Problema: r.problem,
            Estado: r.status,
            'Costo Repuestos': r.partsCost || 0,
            'Total Cobrado': r.cost,
            Ganancia: r.profit || 0,
            Técnico: r.user?.name || 'N/A',
          }))
          filename = `reporte_reparaciones_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        }
        case 'clients': {
          const clients = reportData.clients || []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          rows = clients.map((c: any) => ({
            Nombre: c.name,
            Teléfono: c.phone,
            Email: c.email || '',
            'Total Gastado': c.totalSpent || 0,
            Ventas: c._count?.sales || 0,
            Reparaciones: c._count?.repairs || 0,
            Transacciones: c.totalTransactions || 0,
          }))
          filename = `reporte_clientes_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        }
      }

      if (rows.length === 0) {
        toast.error('No hay datos para exportar')
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
      XLSX.writeFile(workbook, filename)
      toast.success('Reporte exportado exitosamente')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Error al exportar el reporte')
    } finally {
      setExportLoading(false)
    }
  }

  const summaryContent = useMemo(() => {
    if (!reportData?.summary) return null

    switch (selectedReport) {
      case 'sales': return <SalesSummary data={reportData} formatCurrency={formatCurrency} />
      case 'inventory': return <InventorySummary data={reportData} formatCurrency={formatCurrency} />
      case 'repairs': return <RepairsSummary data={reportData} formatCurrency={formatCurrency} />
      case 'clients': return <ClientsSummary data={reportData} formatCurrency={formatCurrency} />
      default: return null
    }
  }, [reportData, selectedReport])

  const detailsContent = useMemo(() => {
    if (!reportData) return null

    switch (selectedReport) {
      case 'sales': return (
        <SalesDetails
          data={reportData.sales || []}
          sortKey={sortKey}
          sortDir={sortDir}
          detailSearch={detailSearch}
          formatCurrency={formatCurrency}
          onToggle={toggleSort}
        />
      )
      case 'repairs': return (
        <RepairsDetails
          data={reportData.repairs || []}
          sortKey={sortKey}
          sortDir={sortDir}
          detailSearch={detailSearch}
          formatCurrency={formatCurrency}
          onToggle={toggleSort}
        />
      )
      case 'inventory': return (
        <InventoryDetails
          data={reportData.products || []}
          sortKey={sortKey}
          sortDir={sortDir}
          detailSearch={detailSearch}
          formatCurrency={formatCurrency}
          onToggle={toggleSort}
        />
      )
      case 'clients': return (
        <ClientsDetails
          data={reportData.clients || []}
          sortKey={sortKey}
          sortDir={sortDir}
          detailSearch={detailSearch}
          formatCurrency={formatCurrency}
          onToggle={toggleSort}
        />
      )
      default: return null
    }
  }, [reportData, selectedReport, sortKey, sortDir, detailSearch])

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Genera y exporta reportes del negocio</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select value={selectedReport} onValueChange={(value: string | null) => value && handleReportChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="inventory">Inventario</SelectItem>
                  <SelectItem value="repairs">Reparaciones</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input id="startDate" type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input id="endDate" type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} />
            </div>

            {selectedReport === 'inventory' && (
              <div>
                <Label htmlFor="category">Categoría</Label>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={filters.category} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="ACCESSORY">Accesorios</SelectItem>
                    <SelectItem value="REPAIR_PART">Repuestos</SelectItem>
                    <SelectItem value="DEVICE">Dispositivos</SelectItem>
                    <SelectItem value="OTHER">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedReport === 'repairs' && (
              <div>
                <Label htmlFor="status">Estado</Label>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={filters.status} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="RECEIVED">Recibido</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="READY">Listo</SelectItem>
                    <SelectItem value="DELIVERED">Entregado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
              {reportData && (
                <Button onClick={exportToExcel} variant="outline" className="w-full" disabled={exportLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportLoading ? 'Exportando...' : 'Exportar Excel'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {selectedReport === 'sales' && <BarChart3 className="h-5 w-5" />}
              {selectedReport === 'inventory' && <Package className="h-5 w-5" />}
              {selectedReport === 'repairs' && <Wrench className="h-5 w-5" />}
              {selectedReport === 'clients' && <Users className="h-5 w-5" />}
              {selectedReport === 'sales' && 'Reporte de Ventas'}
              {selectedReport === 'inventory' && 'Reporte de Inventario'}
              {selectedReport === 'repairs' && 'Reporte de Reparaciones'}
              {selectedReport === 'clients' && 'Reporte de Clientes'}
            </CardTitle>
            <CardDescription>
              {reportData ? 'Reporte generado exitosamente' : 'Selecciona un tipo de reporte y haz clic en generar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!reportData ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Configura los filtros y genera un reporte para ver los resultados
                </p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                  {summaryContent}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar en detalles..."
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {detailsContent}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SalesSummary({ data, formatCurrency }: { data: any; formatCurrency: (n: number) => string }) {
  const s = data.summary
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Ventas" value={s.totalSales} />
        <StatCard title="Ingresos Totales" value={formatCurrency(s.totalRevenue)} className="text-green-600" />
        <StatCard title="Costo Invertido" value={formatCurrency(s.totalCost)} className="text-orange-600" />
        <StatCard title="Ganancia Bruta" value={formatCurrency(s.totalProfit)} className="text-emerald-600" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-blue-600" />} title="Margen de Ganancia" value={`${s.profitMargin?.toFixed(1)}%`} className="text-blue-600" />
        <MetricCard icon={<DollarSign className="h-5 w-5 text-purple-600" />} title="Ticket Promedio" value={formatCurrency(s.averageSale)} className="text-purple-600" />
        <MetricCard icon={<BarChart3 className="h-5 w-5 text-indigo-600" />} title="Métodos de Pago" value={Object.keys(s.paymentMethodStats || {}).length} />
      </div>
      {s.paymentMethodStats && Object.keys(s.paymentMethodStats).length > 0 && (
        <BreakdownCard title="Desglose por Método de Pago">
          {Object.entries(s.paymentMethodStats as Record<string, { count: number; total: number }>).map(([method, data]) => (
            <BreakdownRow key={method} label={method === 'CASH' ? 'Efectivo' : method === 'CARD' ? 'Tarjeta' : 'Transferencia'} sub={`${data.count} transacciones`} value={formatCurrency(data.total)} />
          ))}
        </BreakdownCard>
      )}
      {data.topProducts?.length > 0 && (
        <BreakdownCard title="Productos Más Vendidos">
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.topProducts.slice(0, 10).map((p: any, i: number) => (
            <div key={p.product?.id || i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div>
                  <p className="font-medium">{p.product?.name || 'Producto eliminado'}</p>
                  <p className="text-sm text-muted-foreground">{p.quantity} unidades</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(p.revenue)}</p>
                <p className="text-sm text-emerald-600">Ganancia: {formatCurrency(p.profit || 0)}</p>
              </div>
            </div>
          ))}
        </BreakdownCard>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InventorySummary({ data, formatCurrency }: { data: any; formatCurrency: (n: number) => string }) {
  const s = data.summary
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Productos" value={s.totalProducts} />
        <StatCard title="Unidades en Stock" value={s.totalStock} />
        <StatCard title="Valor de Venta" value={formatCurrency(s.totalValue)} className="text-green-600" />
        <StatCard title="Valor de Costo" value={formatCurrency(s.totalCostValue)} className="text-orange-600" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-green-600" />} title="En Stock" value={s.inStockCount} className="text-green-600" />
        <MetricCard icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} title="Stock Bajo" value={s.lowStockCount} className="text-amber-600" />
        <MetricCard icon={<XCircle className="h-5 w-5 text-red-600" />} title="Agotados" value={s.outOfStockCount} className="text-red-600" />
      </div>
      {data.categoryStats && Object.keys(data.categoryStats).length > 0 && (
        <BreakdownCard title="Por Categoría">
          {Object.entries(data.categoryStats as Record<string, { count: number; stock: number; value: number }>).map(([category, data]) => (
            <BreakdownRow key={category} label={category} sub={`${data.count} productos, ${data.stock} unidades`} value={formatCurrency(data.value)} />
          ))}
        </BreakdownCard>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RepairsSummary({ data, formatCurrency }: { data: any; formatCurrency: (n: number) => string }) {
  const s = data.summary
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Reparaciones" value={s.totalRepairs} />
        <StatCard title="Total Facturado" value={formatCurrency(s.totalRevenue)} className="text-green-600" />
        <StatCard title="Costo Repuestos" value={formatCurrency(s.totalPartsCost)} className="text-orange-600" />
        <StatCard title="Ganancia Real" value={formatCurrency(s.totalProfit)} className="text-emerald-600" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-blue-600" />} title="Promedio Ganancia/Reparación" value={formatCurrency(s.avgProfit)} className="text-blue-600" />
        <MetricCard icon={<DollarSign className="h-5 w-5 text-purple-600" />} title="Promedio por Reparación" value={formatCurrency(s.averageRepair)} className="text-purple-600" />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-600" />
              {s.mostProfitable ? (
                <span className="text-sm font-semibold text-green-600">
                  #{s.mostProfitable.id.slice(-6)} — {formatCurrency(s.mostProfitable.profit || 0)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Reparación Más Rentable</p>
          </CardContent>
        </Card>
      </div>
      {s.statusStats && Object.keys(s.statusStats).length > 0 && (
        <BreakdownCard title="Por Estado">
          {Object.entries(s.statusStats as Record<string, { count: number; revenue: number; profit: number }>).map(([status, data]) => (
            <div key={status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Badge variant={status === 'DELIVERED' ? 'default' : status === 'IN_PROGRESS' ? 'secondary' : status === 'CANCELLED' ? 'destructive' : 'outline'}>
                  {getRepairStatusLabel(status)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{data.count} reparaciones</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(data.revenue)}</p>
                <p className="text-sm text-emerald-600">Ganancia: {formatCurrency(data.profit || 0)}</p>
              </div>
            </div>
          ))}
        </BreakdownCard>
      )}
      {data.deviceStats?.length > 0 && (
        <BreakdownCard title="Por Tipo de Dispositivo">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.deviceStats.slice(0, 10).map(([device, data]: [string, any]) => (
            <BreakdownRow key={device} label={device} sub={`${data.count} reparaciones`} value={formatCurrency(data.revenue)} extra={`Ganancia: ${formatCurrency(data.profit || 0)}`} />
          ))}
        </BreakdownCard>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ClientsSummary({ data, formatCurrency }: { data: any; formatCurrency: (n: number) => string }) {
  const s = data.summary
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Clientes" value={s.totalClients} />
        <StatCard title="Gasto Total" value={formatCurrency(s.totalSpent)} className="text-green-600" />
        <StatCard title="Ganancia Total" value={formatCurrency(s.totalProfit)} className="text-emerald-600" />
        <StatCard title="Nuevos Clientes" value={s.newClients} className="text-green-600" />
      </div>
      <MetricCard icon={<DollarSign className="h-5 w-5 text-purple-600" />} title="Gasto Promedio por Cliente" value={formatCurrency(s.averageSpent)} className="text-purple-600" />
      {data.clients?.length > 0 && (
        <BreakdownCard title="Top Clientes">
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.clients.slice(0, 15).map((client: any, i: number) => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.totalTransactions} transacciones</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(client.totalSpent)}</p>
                <p className="text-sm text-emerald-600">Ganancia: {formatCurrency((client.totalSalesProfit || 0) + (client.totalRepairsProfit || 0))}</p>
              </div>
            </div>
          ))}
        </BreakdownCard>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SalesDetails({ data, sortKey, sortDir, detailSearch, formatCurrency, onToggle }: any) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return data.filter((s: any) =>
      (s.client?.name || '').toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.user?.name || '').toLowerCase().includes(q) ||
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      s.saleItems.some((i: any) => (i.product?.name || '').toLowerCase().includes(q))
    )
  }, [data, detailSearch])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (s: any) => {
    switch (sortKey) {
      case 'date': return new Date(s.createdAt).getTime()
      case 'client': return s.client?.name || s.clientName || ''
      case 'total': return s.total
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      case 'profit': return s.saleItems.reduce((sum: number, i: any) => sum + (i.profit || 0), 0)
      case 'payment': return s.paymentMethod
      default: return new Date(s.createdAt).getTime()
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return filtered.reduce((acc: any, s: any) => {
      acc.total += s.total
      acc.discount += s.discountAmount || 0
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      acc.cost += s.saleItems.reduce((sum: number, i: any) => sum + (i.purchasePriceAtSale * i.quantity), 0)
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      acc.profit += s.saleItems.reduce((sum: number, i: any) => sum + (i.profit || 0), 0)
      return acc
    }, { total: 0, discount: 0, cost: 0, profit: 0 })
  }, [filtered])

  if (filtered.length === 0) return <EmptyState message={detailSearch ? 'No se encontraron ventas con ese filtro' : 'No hay ventas registradas en este período'} />

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <Th><SortHeader label="ID" sortKey="id" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Fecha</Th>
              <Th><SortHeader label="Cliente" sortKey="client" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Productos</Th>
              <Th><SortHeader label="Método Pago" sortKey="payment" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right">Subtotal</Th>
              <Th className="text-right">Desc.</Th>
              <Th className="text-right"><SortHeader label="Total" sortKey="total" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right">Costo</Th>
              <Th className="text-right"><SortHeader label="Ganancia" sortKey="profit" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Vendedor</Th>
            </tr>
          </thead>
          <tbody>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sorted.map((sale: any) => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              const cost = sale.saleItems.reduce((sum: number, i: any) => sum + (i.purchasePriceAtSale * i.quantity), 0)
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              const profit = sale.saleItems.reduce((sum: number, i: any) => sum + (i.profit || 0), 0)
              const subtotal = sale.total + (sale.discountAmount || 0)
              return (
                <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs">#{sale.id.slice(-6)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(sale.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="px-3 py-2.5 font-medium">{sale.client?.name || sale.clientName || 'Ocasional'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {sale.saleItems.slice(0, 3).map((item: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{item.product?.name || 'N/A'} x{item.quantity}</Badge>
                      ))}
                      {sale.saleItems.length > 3 && <span className="text-xs text-muted-foreground">+{sale.saleItems.length - 3} más</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary" className="text-xs">
                      {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{formatCurrency(subtotal)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{sale.discountAmount ? formatCurrency(sale.discountAmount) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(sale.total)}</td>
                  <td className="px-3 py-2.5 text-right text-orange-600">{formatCurrency(cost)}</td>
                  <td className={`px-3 py-2.5 text-right font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(profit)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{sale.user?.name || '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={5} className="px-3 py-3 text-sm">Totales ({filtered.length} ventas)</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{formatCurrency(totals.total + totals.discount)}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{formatCurrency(totals.discount)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(totals.total)}</td>
              <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(totals.cost)}</td>
              <td className={`px-3 py-3 text-right ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totals.profit)}
              </td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RepairsDetails({ data, sortKey, sortDir, detailSearch, formatCurrency, onToggle }: any) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return data.filter((r: any) =>
      (r.client?.name || '').toLowerCase().includes(q) ||
      r.device.toLowerCase().includes(q) ||
      r.problem.toLowerCase().includes(q) ||
      (r.user?.name || '').toLowerCase().includes(q)
    )
  }, [data, detailSearch])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (r: any) => {
    switch (sortKey) {
      case 'date': return new Date(r.createdAt).getTime()
      case 'client': return r.client?.name || ''
      case 'device': return r.device
      case 'status': return r.status
      case 'total': return r.cost
      case 'profit': return r.profit || 0
      default: return new Date(r.createdAt).getTime()
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return filtered.reduce((acc: any, r: any) => {
      acc.cost += r.cost
      acc.partsCost += r.partsCost || 0
      acc.profit += r.profit || 0
      return acc
    }, { cost: 0, partsCost: 0, profit: 0 })
  }, [filtered])

  if (filtered.length === 0) return <EmptyState message={detailSearch ? 'No se encontraron reparaciones con ese filtro' : 'No hay reparaciones registradas en este período'} />

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <Th><SortHeader label="ID" sortKey="id" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Fecha</Th>
              <Th><SortHeader label="Cliente" sortKey="client" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th><SortHeader label="Dispositivo" sortKey="device" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Problema</Th>
              <Th>Repuestos</Th>
              <Th className="text-right">Costo Resp.</Th>
              <Th className="text-right"><SortHeader label="Total Cobrado" sortKey="total" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Ganancia" sortKey="profit" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th><SortHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Técnico</Th>
            </tr>
          </thead>
          <tbody>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sorted.map((repair: any) => (
              <tr key={repair.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs">#{repair.id.slice(-6)}</td>
                <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(repair.createdAt).toLocaleDateString('es-CO')}</td>
                <td className="px-3 py-2.5 font-medium">{repair.client?.name}</td>
                <td className="px-3 py-2.5">{repair.device}</td>
                <td className="px-3 py-2.5 max-w-48 truncate text-muted-foreground text-xs" title={repair.problem}>{repair.problem}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {repair.repairParts?.length > 0 ? repair.repairParts.slice(0, 2).map((part: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{part.product?.name || 'N/A'} x{part.quantity}</Badge>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                    {repair.repairParts?.length > 2 && <span className="text-xs text-muted-foreground">+{repair.repairParts.length - 2} más</span>}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-orange-600">{formatCurrency(repair.partsCost || 0)}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(repair.cost)}</td>
                <td className={`px-3 py-2.5 text-right font-medium ${(repair.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(repair.profit || 0)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={repair.status === 'DELIVERED' ? 'default' : repair.status === 'CANCELLED' ? 'destructive' : repair.status === 'IN_PROGRESS' ? 'secondary' : 'outline'} className="text-xs">
                    {getRepairStatusLabel(repair.status)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{repair.user?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={6} className="px-3 py-3 text-sm">Totales ({filtered.length} reparaciones)</td>
              <td className="px-3 py-3 text-right text-orange-600">{formatCurrency(totals.partsCost)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(totals.cost)}</td>
              <td className={`px-3 py-3 text-right ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totals.profit)}
              </td>
              <td colSpan={2} className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InventoryDetails({ data, sortKey, sortDir, detailSearch, formatCurrency, onToggle }: any) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return data.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.supplier || '').toLowerCase().includes(q)
    )
  }, [data, detailSearch])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (p: any) => {
    switch (sortKey) {
      case 'name': return p.name
      case 'category': return p.category || ''
      case 'stock': return p.stock
      case 'salePrice': return p.salePrice
      case 'purchasePrice': return p.purchasePrice
      case 'margin': return p.salePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : -1
      default: return p.name
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return filtered.reduce((acc: any, p: any) => {
      acc.stock += p.stock
      acc.saleValue += p.stock * p.salePrice
      acc.costValue += p.stock * p.purchasePrice
      return acc
    }, { stock: 0, saleValue: 0, costValue: 0 })
  }, [filtered])

  if (filtered.length === 0) return <EmptyState message={detailSearch ? 'No se encontraron productos con ese filtro' : 'No hay productos en el inventario'} />

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <Th><SortHeader label="Producto" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th><SortHeader label="Categoría" sortKey="category" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Stock" sortKey="stock" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-center">Mínimo</Th>
              <Th className="text-center">Estado</Th>
              <Th className="text-right"><SortHeader label="Costo Compra" sortKey="purchasePrice" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Precio Venta" sortKey="salePrice" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Margen" sortKey="margin" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right">Valor Total</Th>
              <Th>Proveedor</Th>
            </tr>
          </thead>
          <tbody>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sorted.map((product: any) => {
              const margin = product.salePrice > 0 ? ((product.salePrice - product.purchasePrice) / product.salePrice) * 100 : 0
              const { label, variant } = getStockStatus(product.stock, product.minStock)
              return (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium">{product.name}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {product.category === 'ACCESSORY' ? 'Accesorio' : product.category === 'REPAIR_PART' ? 'Repuesto' : product.category === 'DEVICE' ? 'Dispositivo' : 'Otro'}
                    </Badge>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= product.minStock ? 'text-amber-600' : ''}`}>
                    {product.stock}
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{product.minStock}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant={variant} className="text-xs">{label}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{formatCurrency(product.purchasePrice)}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(product.salePrice)}</td>
                  <td className={`px-3 py-2.5 text-right font-medium ${margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                    {margin.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{formatCurrency(product.stock * product.salePrice)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{product.supplier || '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={2} className="px-3 py-3 text-sm">Totales ({filtered.length} productos)</td>
              <td className="px-3 py-3 text-right">{totals.stock}</td>
              <td colSpan={2}></td>
              <td className="px-3 py-3 text-right text-muted-foreground">{formatCurrency(totals.costValue)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(totals.saleValue)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ClientsDetails({ data, sortKey, sortDir, detailSearch, formatCurrency, onToggle }: any) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return data.filter((c: any) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [data, detailSearch])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (c: any) => {
    switch (sortKey) {
      case 'name': return c.name
      case 'spent': return c.totalSpent || 0
      case 'transactions': return c.totalTransactions || 0
      case 'profit': return (c.totalSalesProfit || 0) + (c.totalRepairsProfit || 0)
      default: return c.name
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    return filtered.reduce((acc: any, c: any) => {
      acc.spent += c.totalSpent || 0
      acc.transactions += c.totalTransactions || 0
      acc.profit += (c.totalSalesProfit || 0) + (c.totalRepairsProfit || 0)
      return acc
    }, { spent: 0, transactions: 0, profit: 0 })
  }, [filtered])

  if (filtered.length === 0) return <EmptyState message={detailSearch ? 'No se encontraron clientes con ese filtro' : 'No hay clientes registrados'} />

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <Th><SortHeader label="Nombre" sortKey="name" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Teléfono</Th>
              <Th>Email</Th>
              <Th className="text-right"><SortHeader label="Total Gastado" sortKey="spent" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Transacciones" sortKey="transactions" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Ganancia Generada" sortKey="profit" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Registro</Th>
            </tr>
          </thead>
          <tbody>
{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sorted.map((client: any) => {
              const clientProfit = (client.totalSalesProfit || 0) + (client.totalRepairsProfit || 0)
              return (
                <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium">{client.name}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{client.phone || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-32 truncate">{client.email || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(client.totalSpent || 0)}</td>
                  <td className="px-3 py-2.5 text-right">{client.totalTransactions || 0}</td>
                  <td className={`px-3 py-2.5 text-right font-medium ${clientProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(clientProfit)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={3} className="px-3 py-3 text-sm">Totales ({filtered.length} clientes)</td>
              <td className="px-3 py-3 text-right">{formatCurrency(totals.spent)}</td>
              <td className="px-3 py-3 text-right">{totals.transactions}</td>
              <td className={`px-3 py-3 text-right ${totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(totals.profit)}
              </td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ title, value, className }: { title: string; value: any; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`text-2xl font-bold ${className || ''}`}>{value ?? 0}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricCard({ icon, title, value, className }: { icon: React.ReactNode; title: string; value: any; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-2xl font-bold ${className || ''}`}>{value ?? 0}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function BreakdownCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  )
}

function BreakdownRow({ label, sub, value, extra }: { label: string; sub?: string; value: string; extra?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="font-medium">{label}</p>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="text-right">
        <p className="font-semibold">{value}</p>
        {extra && <p className="text-sm text-emerald-600">{extra}</p>}
      </div>
    </div>
  )
}
