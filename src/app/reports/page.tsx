'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, Filter, BarChart3, Package, Users, Wrench, TrendingUp, DollarSign, TrendingDown, PiggyBank, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { generateReportData } from '@/modules/reports/reports.actions'
import { ProductCategory, RepairStatus, PaymentMethod } from '@prisma/client'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('sales')
  const [filters, setFilters] = useState<any>({})
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  async function generateReport() {
    setLoading(true)
    try {
      const reportFilters = {
        ...filters,
        ...(dateRange.startDate && dateRange.endDate && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
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

  function exportToExcel() {
    toast.info('Exportación Excel en desarrollo')
  }

  function getReportIcon(type: string) {
    switch (type) {
      case 'sales':
        return <BarChart3 className="h-5 w-5" />
      case 'inventory':
        return <Package className="h-5 w-5" />
      case 'repairs':
        return <Wrench className="h-5 w-5" />
      case 'clients':
        return <Users className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  function getReportTitle(type: string) {
    switch (type) {
      case 'sales':
        return 'Reporte de Ventas'
      case 'inventory':
        return 'Reporte de Inventario'
      case 'repairs':
        return 'Reporte de Reparaciones'
      case 'clients':
        return 'Reporte de Clientes'
      default:
        return 'Reporte'
    }
  }

  function getPaymentMethodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
    }
    return labels[method] || method
  }

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-gray-600">Genera y exporta reportes del negocio</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Report Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Configuracion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select value={selectedReport} onValueChange={(value: string | null) => value && setSelectedReport(value)}>
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
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev: any) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev: any) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {selectedReport === 'inventory' && (
              <div>
                <Label htmlFor="category">Categoria</Label>
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
                <div className="space-y-2">
                  <Button onClick={exportToExcel} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getReportIcon(selectedReport)}
              {getReportTitle(selectedReport)}
            </CardTitle>
            <CardDescription>
              {reportData ? 'Reporte generado exitosamente' : 'Selecciona un tipo de reporte y haz clic en generar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!reportData ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">
                  Configura los filtros y genera un reporte para ver los resultados
                </p>
              </div>
            ) : (
              <Tabs defaultValue="summary" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                </TabsList>

                {/* ==================== SALES REPORT ==================== */}
                <TabsContent value="summary" className="space-y-6">
                  {selectedReport === 'sales' && reportData.summary && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{reportData.summary.totalSales}</div>
                            <p className="text-sm text-gray-600">Total Ventas</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalRevenue)}</div>
                            <p className="text-sm text-gray-600">Ingresos Totales</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.summary.totalCost)}</div>
                            <p className="text-sm text-gray-600">Costo Invertido</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.summary.totalProfit)}</div>
                            <p className="text-sm text-gray-600">Ganancia Bruta</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                              <span className="text-2xl font-bold text-blue-600">
                                {reportData.summary.profitMargin?.toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Margen de Ganancia</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-purple-600" />
                              <span className="text-2xl font-bold text-purple-600">
                                {formatCurrency(reportData.summary.averageSale)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Ticket Promedio</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                              {Object.keys(reportData.summary.paymentMethodStats).length}
                            </div>
                            <p className="text-sm text-gray-600">Metodos de Pago</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Payment Method Breakdown */}
                      {reportData.summary.paymentMethodStats && Object.keys(reportData.summary.paymentMethodStats).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Desglose por Metodo de Pago</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {Object.entries(reportData.summary.paymentMethodStats as Record<PaymentMethod, { count: number; total: number }>).map(([method, data]) => (
                                <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{getPaymentMethodLabel(method)}</p>
                                    <p className="text-sm text-gray-500">{data.count} transacciones</p>
                                  </div>
                                  <p className="font-semibold">{formatCurrency(data.total)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Top Products */}
                      {reportData.topProducts && reportData.topProducts.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Productos Mas Vendidos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {reportData.topProducts.slice(0, 10).map((product: any, index: number) => (
                                <div key={product.product?.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                                    <div>
                                      <p className="font-medium">{product.product?.name || 'Producto eliminado'}</p>
                                      <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                                    <p className="text-sm text-emerald-600">Ganancia: {formatCurrency(product.profit || 0)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* ==================== INVENTORY REPORT ==================== */}
                  {selectedReport === 'inventory' && reportData.summary && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{reportData.summary.totalProducts}</div>
                            <p className="text-sm text-gray-600">Total Productos</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{reportData.summary.totalStock}</div>
                            <p className="text-sm text-gray-600">Unidades en Stock</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalValue)}</div>
                            <p className="text-sm text-gray-600">Valor de Venta</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.summary.totalCostValue)}</div>
                            <p className="text-sm text-gray-600">Valor de Costo</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              <span className="text-2xl font-bold text-green-600">{reportData.summary.inStockCount}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">En Stock</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                              <span className="text-2xl font-bold text-amber-600">{reportData.summary.lowStockCount}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Stock Bajo</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              <span className="text-2xl font-bold text-red-600">{reportData.summary.outOfStockCount}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Agotados</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Category Breakdown */}
                      {reportData.categoryStats && Object.keys(reportData.categoryStats).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Por Categoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {Object.entries(reportData.categoryStats).map(([category, data]: [string, any]) => (
                                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{category}</p>
                                    <p className="text-sm text-gray-500">{data.count} productos, {data.stock} unidades</p>
                                  </div>
                                  <p className="font-semibold">{formatCurrency(data.value)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* ==================== REPAIRS REPORT ==================== */}
                  {selectedReport === 'repairs' && reportData.summary && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{reportData.summary.totalRepairs}</div>
                            <p className="text-sm text-gray-600">Total Reparaciones</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalRevenue)}</div>
                            <p className="text-sm text-gray-600">Total Facturado</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(reportData.summary.totalPartsCost)}</div>
                            <p className="text-sm text-gray-600">Costo Repuestos</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.summary.totalProfit)}</div>
                            <p className="text-sm text-gray-600">Ganancia Real</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                              <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(reportData.summary.avgProfit)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Promedio Ganancia/Reparacion</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-purple-600" />
                              <span className="text-2xl font-bold text-purple-600">
                                {formatCurrency(reportData.summary.averageRepair)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Promedio por Reparacion</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <PiggyBank className="h-5 w-5 text-green-600" />
                              {reportData.summary.mostProfitable ? (
                                <span className="text-sm font-semibold text-green-600">
                                  #{reportData.summary.mostProfitable.id.slice(-6)} — {formatCurrency(reportData.summary.mostProfitable.profit || 0)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">N/A</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Reparacion Mas Rentable</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Status Breakdown */}
                      {reportData.summary.statusStats && Object.keys(reportData.summary.statusStats).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Por Estado</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {Object.entries(reportData.summary.statusStats).map(([status, data]: [string, any]) => (
                                <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={status === 'DELIVERED' ? 'default' : status === 'IN_PROGRESS' ? 'secondary' : status === 'CANCELLED' ? 'destructive' : 'outline'}>
                                        {status === 'RECEIVED' ? 'Recibido' : status === 'IN_PROGRESS' ? 'En Progreso' : status === 'READY' ? 'Listo' : status === 'DELIVERED' ? 'Entregado' : 'Cancelado'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{data.count} reparaciones</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(data.revenue)}</p>
                                    <p className="text-sm text-emerald-600">Ganancia: {formatCurrency(data.profit || 0)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Device Breakdown */}
                      {reportData.deviceStats && reportData.deviceStats.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Por Tipo de Dispositivo</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {reportData.deviceStats.slice(0, 10).map(([device, data]: [string, any]) => (
                                <div key={device} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{device}</p>
                                    <p className="text-sm text-gray-500">{data.count} reparaciones</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(data.revenue)}</p>
                                    <p className="text-sm text-emerald-600">Ganancia: {formatCurrency(data.profit || 0)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* ==================== CLIENTS REPORT ==================== */}
                  {selectedReport === 'clients' && reportData.summary && (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold">{reportData.summary.totalClients}</div>
                            <p className="text-sm text-gray-600">Total Clientes</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalSpent)}</div>
                            <p className="text-sm text-gray-600">Gasto Total</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.summary.totalProfit)}</div>
                            <p className="text-sm text-gray-600">Ganancia Total</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{reportData.summary.newClients}</div>
                            <p className="text-sm text-gray-600">Nuevos Clientes</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                            <span className="text-2xl font-bold text-purple-600">
                              {formatCurrency(reportData.summary.averageSpent)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Gasto Promedio por Cliente</p>
                        </CardContent>
                      </Card>

                      {/* Top Clients */}
                      {reportData.clients && reportData.clients.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Top Clientes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {reportData.clients.slice(0, 15).map((client: any, index: number) => (
                                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                                    <div>
                                      <p className="font-medium">{client.name}</p>
                                      <p className="text-sm text-gray-500">
                                        {client.totalTransactions} transacciones
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(client.totalSpent)}</p>
                                    <p className="text-sm text-emerald-600">
                                      Ganancia: {formatCurrency((client.totalSalesProfit || 0) + (client.totalRepairsProfit || 0))}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* ==================== DETAILS TAB ==================== */}
                  {selectedReport === 'sales' && reportData.sales && reportData.sales.length > 0 && (
                    <TabsContent value="details" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detalle de Ventas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">ID</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Cliente</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Items</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Ingreso</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Costo</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Ganancia</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.sales.slice(0, 20).map((sale: any) => {
                                  const saleCost = sale.saleItems.reduce((sum: number, item: any) => sum + (item.purchasePriceAtSale * item.quantity), 0)
                                  const saleProfit = sale.saleItems.reduce((sum: number, item: any) => sum + (item.profit || 0), 0)
                                  return (
                                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                                      <td className="py-2 px-3">#{sale.id.slice(-6)}</td>
                                      <td className="py-2 px-3">{sale.client?.name || sale.clientName || 'Ocasional'}</td>
                                      <td className="py-2 px-3">{sale.saleItems.length} items</td>
                                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(sale.total)}</td>
                                      <td className="py-2 px-3 text-right text-orange-600">{formatCurrency(saleCost)}</td>
                                      <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(saleProfit)}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {selectedReport === 'repairs' && reportData.repairs && reportData.repairs.length > 0 && (
                    <TabsContent value="details" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detalle de Reparaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">ID</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Cliente</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Dispositivo</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Estado</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Facturado</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Costo</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Ganancia</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.repairs.slice(0, 20).map((repair: any) => (
                                  <tr key={repair.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-3">#{repair.id.slice(-6)}</td>
                                    <td className="py-2 px-3">{repair.client?.name}</td>
                                    <td className="py-2 px-3">{repair.device}</td>
                                    <td className="py-2 px-3">
                                      <Badge variant={repair.status === 'DELIVERED' ? 'default' : repair.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                                        {repair.status === 'RECEIVED' ? 'Recibido' : repair.status === 'IN_PROGRESS' ? 'En Progreso' : repair.status === 'READY' ? 'Listo' : repair.status === 'DELIVERED' ? 'Entregado' : 'Cancelado'}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(repair.cost)}</td>
                                    <td className="py-2 px-3 text-right text-orange-600">{formatCurrency(repair.partsCost || 0)}</td>
                                    <td className="py-2 px-3 text-right text-emerald-600">{formatCurrency(repair.profit || 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {selectedReport === 'inventory' && reportData.products && reportData.products.length > 0 && (
                    <TabsContent value="details" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detalle de Inventario</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Producto</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500">Stock</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500">Mínimo</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500">Estado</th>
                                  <th className="text-right py-2 px-3 font-medium text-gray-500">Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.products.slice(0, 50).map((product: any) => {
                                  const isOutOfStock = product.stock === 0
                                  const isLowStock = product.stock > 0 && product.stock <= product.minStock
                                  const stockVariant = isOutOfStock ? 'destructive' : isLowStock ? 'warning' : 'default' as const
                                  const stockLabel = isOutOfStock ? 'Agotado' : isLowStock ? 'Stock Bajo' : 'En Stock'
                                  return (
                                    <tr key={product.id} className="border-b hover:bg-gray-50">
                                      <td className="py-2 px-3 font-medium">{product.name}</td>
                                      <td className="py-2 px-3 text-center">{product.stock}</td>
                                      <td className="py-2 px-3 text-center text-muted-foreground">{product.minStock}</td>
                                      <td className="py-2 px-3 text-center">
                                        <Badge variant={stockVariant}>{stockLabel}</Badge>
                                      </td>
                                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(product.salePrice)}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                            {reportData.products.length > 50 && (
                              <p className="text-sm text-muted-foreground text-center pt-4">
                                Mostrando 50 de {reportData.products.length} productos
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {selectedReport === 'clients' && (
                    <TabsContent value="details" className="text-center py-8">
                      <p className="text-gray-600">Los detalles completos se muestran en las tablas del resumen.</p>
                    </TabsContent>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
