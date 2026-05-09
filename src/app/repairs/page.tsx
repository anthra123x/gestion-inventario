'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Wrench, Clock, CheckCircle, XCircle, PiggyBank, TrendingUp, DollarSign, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/format'
import { getRepairs, getRepairStats, updateRepairStatus } from '@/modules/repairs/repairs.actions'
import { RepairStatus } from '@prisma/client'

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'ALL'>('ALL')
  const [totalRepairs, setTotalRepairs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedStatus, setDebouncedStatus] = useState<RepairStatus | 'ALL'>('ALL')
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStatus(statusFilter), 300)
    return () => clearTimeout(timer)
  }, [statusFilter])

  useEffect(() => {
    loadData()
  }, [debouncedSearch, debouncedStatus, page])

  async function loadData() {
    try {
      setLoading(true)
      const [repairsData, statsData] = await Promise.all([
        getRepairs(debouncedSearch || undefined, debouncedStatus !== 'ALL' ? debouncedStatus : undefined, page, pageSize),
        page === 1 ? getRepairStats() : Promise.resolve(null),
      ])
      setRepairs(repairsData.repairs)
      setTotalRepairs(repairsData.total)
      setTotalPages(repairsData.totalPages)
      if (statsData) setStats(statsData)
    } catch (error) {
      console.error('Error loading repairs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(repairId: string, newStatus: RepairStatus) {
    try {
      await updateRepairStatus(repairId, newStatus)
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  function getStatusInfo(status: RepairStatus) {
    const info: Record<RepairStatus, { label: string; icon: typeof Clock; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }> = {
      RECEIVED: { label: 'Recibido', icon: Clock, variant: 'info' },
      IN_PROGRESS: { label: 'En Progreso', icon: Wrench, variant: 'warning' },
      READY: { label: 'Listo', icon: CheckCircle, variant: 'success' },
      DELIVERED: { label: 'Entregado', icon: CheckCircle, variant: 'purple' },
      CANCELLED: { label: 'Cancelado', icon: XCircle, variant: 'error' }
    }
    return info[status]
  }

  function getStatusNextOptions(status: RepairStatus): RepairStatus[] {
    const flow: Record<RepairStatus, RepairStatus[]> = {
      RECEIVED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['READY', 'RECEIVED', 'CANCELLED'],
      READY: ['DELIVERED', 'IN_PROGRESS', 'RECEIVED', 'CANCELLED'],
      DELIVERED: ['READY', 'IN_PROGRESS', 'RECEIVED'],
      CANCELLED: ['RECEIVED']
    }
    return flow[status] || []
  }

  if (loading && repairs.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-52" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>

        <StatCardGrid columns={4}>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </StatCardGrid>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const completionRate = stats && stats.totalRepairs > 0 
    ? Math.round((stats.completedRepairs / stats.totalRepairs) * 100) 
    : 0

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Reparaciones"
        description="Gestiona las órdenes de reparación"
        actions={
          <Link href="/repairs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reparación
            </Button>
          </Link>
        }
      />

      {stats && (
        <>
          <StatCardGrid columns={4}>
            <StatCard
              title="Total Reparaciones"
              value={stats.totalRepairs}
              change={`${stats.totalRepairs} órdenes`}
              icon={Wrench}
              color="default"
            />
            <StatCard
              title="Activas"
              value={stats.activeRepairs}
              change="En proceso"
              icon={Clock}
              color="info"
            />
            <StatCard
              title="Completadas"
              value={stats.completedRepairs}
              change={`Tasa: ${completionRate}%`}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Ganancia Total"
              value={formatCurrency(stats.totalProfit || 0)}
              change={`Promedio: ${formatCurrency(stats.avgProfit || 0)}`}
              icon={PiggyBank}
              color="success"
            />
          </StatCardGrid>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Total Facturado
              </div>
              <div className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue || 0)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Wrench className="h-4 w-4" />
                Costo Repuestos
              </div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalPartsCost || 0)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Ganancia Promedio
              </div>
              <div className="text-xl font-bold">{formatCurrency(stats.avgProfit || 0)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertCircle className="h-4 w-4" />
                Tasa Completación
              </div>
              <div className="text-xl font-bold text-purple-600">{completionRate}%</div>
            </div>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar reparaciones..."
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RepairStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="RECEIVED">Recibido</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="READY">Listo</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => {
                  const statusInfo = getStatusInfo(repair.status)
                  const StatusIcon = statusInfo.icon
                  return (
                    <TableRow key={repair.id}>
                      <TableCell className="font-mono text-sm">#{repair.id.slice(-6)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{repair.client?.name}</div>
                          <div className="text-xs text-muted-foreground">{repair.client?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{repair.device}</div>
                          <div className="text-xs text-muted-foreground max-w-[150px] truncate">{repair.problem}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={statusInfo.variant} dot>
                          {statusInfo.label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(repair.cost)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(repair.createdAt).toLocaleDateString('es-CO')}</div>
                        <div className="text-xs text-muted-foreground">{new Date(repair.createdAt).toLocaleTimeString('es-CO')}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getStatusNextOptions(repair.status).length > 0 && (
                            <Select
                              onValueChange={(value) => handleStatusChange(repair.id, value as RepairStatus)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {getStatusNextOptions(repair.status).map((status) => {
                                  const info = getStatusInfo(status)
                                  const InfoIcon = info.icon
                                  return (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <InfoIcon className="h-3.5 w-3.5" />
                                        <span>{info.label}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          )}
                          <Link href={`/repairs/${repair.id}`}>
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {repairs.length === 0 && (
            <EmptyState
              icon={Wrench}
              title={search || statusFilter !== 'ALL' ? 'Sin resultados' : 'Sin reparaciones'}
              description={search || statusFilter !== 'ALL' ? 'No hay reparaciones que coincidan con tu búsqueda' : 'Crea tu primera orden de reparación'}
              action={search || statusFilter !== 'ALL' ? undefined : { label: 'Crear reparación', href: '/repairs/new' }}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} — {totalRepairs} reparaciones
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}