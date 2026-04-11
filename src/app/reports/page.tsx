'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, Filter, BarChart3, Package, Users, Wrench } from 'lucide-react'
import { generateReportData } from '@/modules/reports/reports.actions'
import { ProductCategory, RepairStatus } from '@prisma/client'

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
    } finally {
      setLoading(false)
    }
  }

  function exportToPDF() {
    // This would implement PDF export using pdf-lib or react-pdf
    alert('Exportación PDF en desarrollo')
  }

  function exportToExcel() {
    // This would implement Excel export using xlsx
    alert('Exportación Excel en desarrollo')
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Configuración
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

            {/* Date Range */}
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

            {/* Report-specific filters */}
            {selectedReport === 'inventory' && (
              <div>
                <Label htmlFor="category">Categoría</Label>
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
                  <Button onClick={exportToPDF} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
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
              <Tabs defaultValue="summary" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {/* Summary Cards */}
                  {selectedReport === 'sales' && reportData.summary && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{reportData.summary.totalSales}</div>
                          <p className="text-sm text-gray-600">Total Ventas</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.totalRevenue.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Ingresos Totales</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.averageSale.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Promedio por Venta</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{Object.keys(reportData.summary.paymentMethodStats).length}</div>
                          <p className="text-sm text-gray-600">Métodos de Pago</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedReport === 'inventory' && reportData.summary && (
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
                          <div className="text-2xl font-bold">${reportData.summary.totalValue.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Valor del Inventario</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-orange-600">{reportData.summary.lowStockCount}</div>
                          <p className="text-sm text-gray-600">Stock Bajo</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedReport === 'repairs' && reportData.summary && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{reportData.summary.totalRepairs}</div>
                          <p className="text-sm text-gray-600">Total Reparaciones</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.totalRevenue.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Ingresos por Reparaciones</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.averageRepair.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Promedio por Reparación</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{Object.keys(reportData.summary.statusStats).length}</div>
                          <p className="text-sm text-gray-600">Estados</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedReport === 'clients' && reportData.summary && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{reportData.summary.totalClients}</div>
                          <p className="text-sm text-gray-600">Total Clientes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.totalSpent.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Gasto Total</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${reportData.summary.averageSpent.toFixed(2)}</div>
                          <p className="text-sm text-gray-600">Gasto Promedio</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-600">{reportData.summary.newClients}</div>
                          <p className="text-sm text-gray-600">Nuevos Clientes</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details">
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Vista detallada del reporte. Aquí se mostrarían tablas completas con los datos.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      (Implementación de tablas detalladas en desarrollo)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
