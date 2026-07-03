'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, Filter, Users, Wrench, TrendingUp, DollarSign, Search, ChevronUp, ChevronDown, FileDown, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { generateReportData } from '@/modules/reports/reports.actions'
import { exportReportToExcel, exportReportToPdf } from '@/modules/export/export.actions'
import { getRepairStatusLabel } from '@/lib/labels'

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
  const [selectedReport, setSelectedReport] = useState<string>('repairs')
  const [filters, setFilters] = useState<Record<string, string>>({ status: '' })
  const [reportData, setReportData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
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

  async function handleExportExcel() {
    if (!reportData) return
    setLoading(true)
    try {
      const reportFilters: Record<string, unknown> = {
        ...filters,
        ...(dateRange.startDate && dateRange.endDate && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate + 'T23:59:59'),
        }),
      }
      const result = await exportReportToExcel(selectedReport, reportFilters) as { success: boolean; data?: string; filename?: string; error?: string }
      if (result.success) {
        const link = document.createElement('a')
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data || ''}`
        link.download = result.filename || ''
        link.click()
        toast.success('Reporte exportado a Excel')
      } else {
        toast.error(result.error || 'Error al exportar')
      }
    } catch {
      toast.error('Error al exportar a Excel')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportPdf() {
    if (!reportData) return
    setLoading(true)
    try {
      const reportFilters: Record<string, unknown> = {
        ...filters,
        ...(dateRange.startDate && dateRange.endDate && {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate + 'T23:59:59'),
        }),
      }
      const result = await exportReportToPdf(selectedReport, reportFilters) as { success: boolean; data?: string; filename?: string; error?: string }
      if (result.success) {
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${result.data || ''}`
        link.download = result.filename || ''
        link.click()
        toast.success('Reporte exportado a PDF')
      } else {
        toast.error(result.error || 'Error al exportar')
      }
    } catch {
      toast.error('Error al exportar a PDF')
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    setLoading(true)
    try {
      const reportFilters: Record<string, unknown> = {
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

  const summaryContent = useMemo(() => {
    if (!reportData || !('summary' in (reportData as Record<string, unknown>))) return null
    switch (selectedReport) {
      case 'repairs': return <RepairsSummary data={reportData} formatCurrency={formatCurrency} />
      case 'clients': return <ClientsSummary data={reportData} formatCurrency={formatCurrency} />
      default: return null
    }
  }, [reportData, selectedReport])

  const detailsContent = useMemo(() => {
    if (!reportData) return null
    switch (selectedReport) {
      case 'repairs': return (
        <RepairsDetails
          data={(reportData as { repairs: unknown[] }).repairs || []}
          sortKey={sortKey}
          sortDir={sortDir}
          detailSearch={detailSearch}
          formatCurrency={formatCurrency}
          onToggle={toggleSort}
        />
      )
      case 'clients': return (
        <ClientsDetails
          data={(reportData as { clients: unknown[] }).clients || []}
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
        <p className="text-muted-foreground">Genera y exporta reportes del taller</p>
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

            {selectedReport === 'repairs' && (
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value || '' }))}>
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
              {reportData !== null && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleExportExcel} disabled={loading} variant="outline" size="sm" className="flex-1">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    Excel
                  </Button>
                  <Button onClick={handleExportPdf} disabled={loading} variant="outline" size="sm" className="flex-1">
                    <FileDown className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {selectedReport === 'repairs' && <Wrench className="h-5 w-5" />}
              {selectedReport === 'clients' && <Users className="h-5 w-5" />}
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

function StatCard({ title, value, className }: { title: string; value: unknown; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`text-2xl font-bold ${className || ''}`}>{String(value ?? 0)}</div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

function MetricCard({ icon, title, value, className }: { icon: React.ReactNode; title: string; value: unknown; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className={`text-xl font-bold ${className || ''}`}>{String(value ?? 0)}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BreakdownCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  )
}

function BreakdownRow({ label, sub, value, extra }: { label: string; sub: string; value: string; extra?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{value}</p>
        {extra && <p className="text-sm text-muted-foreground">{extra}</p>}
      </div>
    </div>
  )
}

function RepairsSummary({ data, formatCurrency: fc }: { data: unknown; formatCurrency: (n: number) => string }) {
  const s = data as {
    summary: {
      totalRepairs: number
      totalRevenue: number
      totalPartsCost: number
      totalLabor: number
      averageRepair: number
      statusStats: Record<string, { count: number; revenue: number; partsCost: number; laborCost: number }>
    }
  }
  const { summary } = s
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Reparaciones" value={summary.totalRepairs} />
        <StatCard title="Total Facturado" value={fc(summary.totalRevenue)} className="text-green-600" />
        <StatCard title="Costo Repuestos" value={fc(summary.totalPartsCost)} className="text-orange-600" />
        <StatCard title="Mano de Obra" value={fc(summary.totalLabor)} className="text-primary" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard icon={<TrendingUp className="h-5 w-5 text-primary" />} title="Promedio por Reparación" value={fc(summary.averageRepair)} className="text-primary" />
        <MetricCard icon={<DollarSign className="h-5 w-5 text-purple-600" />} title="Total Reparaciones" value={summary.totalRepairs} className="text-purple-600" />
      </div>
      {summary.statusStats && Object.keys(summary.statusStats).length > 0 && (
        <BreakdownCard title="Por Estado">
          {Object.entries(summary.statusStats).map(([status, statusData]) => (
            <div key={status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Badge variant={status === 'DELIVERED' ? 'default' : status === 'IN_PROGRESS' ? 'secondary' : status === 'CANCELLED' ? 'destructive' : 'outline'}>
                  {getRepairStatusLabel(status)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{statusData.count} reparaciones</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{fc(statusData.revenue)}</p>
              </div>
            </div>
          ))}
        </BreakdownCard>
      )}
    </>
  )
}

function ClientsSummary({ data, formatCurrency: fc }: { data: unknown; formatCurrency: (n: number) => string }) {
  const summary = (data as { summary: { totalClients: number; totalSpent: number; averageSpent: number; newClients: number } }).summary
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Clientes" value={summary.totalClients} />
        <StatCard title="Gasto Total" value={fc(summary.totalSpent)} className="text-green-600" />
        <StatCard title="Gasto Promedio" value={fc(summary.averageSpent)} className="text-purple-600" />
        <StatCard title="Nuevos Clientes" value={summary.newClients} className="text-primary" />
      </div>
    </>
  )
}

function RepairsDetails({ data, sortKey, sortDir, detailSearch, formatCurrency: fc, onToggle }: {
  data: unknown[]
  sortKey: string
  sortDir: SortDir
  detailSearch: string
  formatCurrency: (n: number) => string
  onToggle: (key: string) => void
}) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
    return (data as Array<Record<string, unknown>>).filter((r) =>
      ((r.client as Record<string, string> | null)?.name || '').toLowerCase().includes(q) ||
      String(r.device || '').toLowerCase().includes(q) ||
      String(r.problem || '').toLowerCase().includes(q)
    )
  }, [data, detailSearch])

  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (r) => {
    const rec = r as Record<string, unknown>
    switch (sortKey) {
      case 'date': return new Date(rec.createdAt as string).getTime()
      case 'client': return (rec.client as Record<string, string> | null)?.name || ''
      case 'device': return String(rec.device || '')
      case 'status': return String(rec.status || '')
      case 'total': return (rec.laborCost as number) + ((rec.repairParts as Array<{ total: number }>) || []).reduce((s: number, p: { total: number }) => s + p.total, 0)
      default: return new Date(rec.createdAt as string).getTime()
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
    return (filtered as Array<Record<string, unknown>>).reduce<{ laborCost: number; partsCost: number }>((acc, r) => {
      const partsTotal = ((r.repairParts as Array<{ total: number }>) || []).reduce((s: number, p: { total: number }) => s + p.total, 0)
      acc.laborCost += (r.laborCost as number) || 0
      acc.partsCost += partsTotal
      return acc
    }, { laborCost: 0, partsCost: 0 })
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
              <Th className="text-right">Costo Resp.</Th>
              <Th className="text-right"><SortHeader label="Mano Obra" sortKey="labor" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th className="text-right"><SortHeader label="Total" sortKey="total" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th><SortHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
            </tr>
          </thead>
          <tbody>
            {(sorted as Array<Record<string, unknown>>).map((repair) => {
              const partsTotal = ((repair.repairParts as Array<{ total: number }>) || []).reduce((s: number, p: { total: number }) => s + p.total, 0)
              const total = (repair.laborCost as number) + partsTotal
              return (
                <tr key={repair.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs">#{(repair.id as string).slice(-6)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(repair.createdAt as string).toLocaleDateString('es-CO')}</td>
                  <td className="px-3 py-2.5 font-medium">{(repair.client as Record<string, string> | null)?.name}</td>
                  <td className="px-3 py-2.5">{repair.device as string}</td>
                  <td className="px-3 py-2.5 max-w-48 truncate text-muted-foreground text-xs" title={repair.problem as string}>{repair.problem as string}</td>
                  <td className="px-3 py-2.5 text-right text-orange-600">{fc(partsTotal)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fc(repair.laborCost as number)}</td>
                  <td className="px-3 py-2.5 text-right font-bold">{fc(total)}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={repair.status === 'DELIVERED' ? 'default' : repair.status === 'CANCELLED' ? 'destructive' : repair.status === 'IN_PROGRESS' ? 'secondary' : 'outline'} className="text-xs">
                      {getRepairStatusLabel(repair.status as string)}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={5} className="px-3 py-3 text-sm">Totales ({filtered.length} reparaciones)</td>
              <td className="px-3 py-3 text-right text-orange-600">{fc(totals.partsCost)}</td>
              <td className="px-3 py-3 text-right">{fc(totals.laborCost)}</td>
              <td className="px-3 py-3 text-right">{fc(totals.laborCost + totals.partsCost)}</td>
              <td colSpan={1} className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function ClientsDetails({ data, sortKey, sortDir, detailSearch, formatCurrency: fc, onToggle }: {
  data: unknown[]
  sortKey: string
  sortDir: SortDir
  detailSearch: string
  formatCurrency: (n: number) => string
  onToggle: (key: string) => void
}) {
  const filtered = useMemo(() => {
    if (!detailSearch) return data
    const q = detailSearch.toLowerCase()
    return (data as Array<Record<string, unknown>>).filter((c) =>
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.phone || '').toLowerCase().includes(q) ||
      String(c.email || '').toLowerCase().includes(q)
    )
  }, [data, detailSearch])

  const sorted = useMemo(() => sortData(filtered, sortKey, sortDir, (c) => {
    const cl = c as Record<string, unknown>
    switch (sortKey) {
      case 'name': return String(cl.name || '')
      case 'spent': return (cl.totalSpent as number) || 0
      case 'transactions': return (cl.totalTransactions as number) || 0
      default: return String(cl.name || '')
    }
  }), [filtered, sortKey, sortDir])

  const totals = useMemo(() => {
    return (filtered as Array<Record<string, unknown>>).reduce<{ spent: number; transactions: number }>((acc, c) => {
      acc.spent += (c.totalSpent as number) || 0
      acc.transactions += (c.totalTransactions as number) || 0
      return acc
    }, { spent: 0, transactions: 0 })
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
              <Th className="text-right"><SortHeader label="Reparaciones" sortKey="transactions" currentSortKey={sortKey} currentSortDir={sortDir} onToggle={onToggle} /></Th>
              <Th>Registro</Th>
            </tr>
          </thead>
          <tbody>
            {(sorted as Array<Record<string, unknown>>).map((client) => (
              <tr key={client.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-medium">{client.name as string}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{String(client.phone || '—')}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-32 truncate">{String(client.email || '—')}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{fc((client.totalSpent as number) || 0)}</td>
                <td className="px-3 py-2.5 text-right">{(client.totalTransactions as number) || 0}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {new Date(client.createdAt as string).toLocaleDateString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td colSpan={3} className="px-3 py-3 text-sm">Totales ({filtered.length} clientes)</td>
              <td className="px-3 py-3 text-right">{fc(totals.spent)}</td>
              <td className="px-3 py-3 text-right">{totals.transactions}</td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
