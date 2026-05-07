'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Eye, Wrench, Clock, CheckCircle, AlertCircle, XCircle, PiggyBank, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { getRepairs, getRepairStats, updateRepairStatus } from '@/modules/repairs/repairs.actions'
import { RepairStatus } from '@prisma/client'

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'ALL'>('ALL')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterRepairs()
  }, [repairs, search, statusFilter])

  async function loadData() {
    try {
      const [repairsData, statsData] = await Promise.all([
        getRepairs(),
        getRepairStats(),
      ])
      setRepairs(repairsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading repairs:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterRepairs() {
    let filtered = repairs

    if (search) {
      filtered = filtered.filter(repair =>
        repair.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        repair.client?.phone?.toLowerCase().includes(search.toLowerCase()) ||
        repair.device?.toLowerCase().includes(search.toLowerCase()) ||
        repair.problem?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(repair => repair.status === statusFilter)
    }

    return filtered
  }

  async function handleStatusChange(repairId: string, newStatus: RepairStatus) {
    try {
      await updateRepairStatus(repairId, newStatus)
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  function getStatusIcon(status: RepairStatus) {
    switch (status) {
      case 'RECEIVED':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Wrench className="h-4 w-4" />
      case 'READY':
        return <CheckCircle className="h-4 w-4" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  function getStatusLabel(status: RepairStatus) {
    const labels = {
      RECEIVED: 'Recibido',
      IN_PROGRESS: 'En Progreso',
      READY: 'Listo',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado'
    }
    return labels[status]
  }

  function getStatusColor(status: RepairStatus) {
    const colors = {
      RECEIVED: 'secondary',
      IN_PROGRESS: 'default',
      READY: 'outline',
      DELIVERED: 'default',
      CANCELLED: 'destructive'
    }
    return colors[status]
  }

  function getStatusBadgeColor(status: RepairStatus): string {
    const colors: Record<RepairStatus, string> = {
      RECEIVED: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      READY: 'bg-green-100 text-green-800 border-green-200',
      DELIVERED: 'bg-purple-100 text-purple-800 border-purple-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status]
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

  const filteredRepairs = filterRepairs()

  if (loading) {
    return (
      <div className="container mx-auto py-6 min-h-screen space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-52" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reparaciones</h1>
          <p className="text-gray-600">Gestiona las órdenes de reparación</p>
        </div>
        <Link href="/repairs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reparación
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reparaciones</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRepairs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeRepairs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedRepairs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Completación</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalRepairs > 0 
                  ? `${Math.round((stats.completedRepairs / stats.totalRepairs) * 100)}%`
                  : '0%'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profit Stats */}
      {stats && stats.totalProfit !== undefined && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Repuestos</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.totalPartsCost || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Real</CardTitle>
              <PiggyBank className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalProfit || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio/Reparación</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.avgProfit || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar reparaciones..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RepairStatus | 'ALL')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="RECEIVED">Recibido</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="READY">Listo</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Repairs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reparaciones ({filteredRepairs.length})</CardTitle>
          <CardDescription>
            Órdenes de reparación registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Problema</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell className="font-medium">#{repair.id.slice(-6)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{repair.client?.name}</div>
                      <div className="text-sm text-gray-500">{repair.client?.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{repair.device}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={repair.problem}>
                      {repair.problem}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`flex items-center space-x-1 ${getStatusBadgeColor(repair.status)}`}>
                        {getStatusIcon(repair.status)}
                        <span>{getStatusLabel(repair.status)}</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(repair.cost)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(repair.createdAt).toLocaleDateString()}
                      <div className="text-gray-500">
                        {new Date(repair.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {/* Status Quick Actions */}
                      {getStatusNextOptions(repair.status).length > 0 ? (
                        <Select
                          onValueChange={(value) => handleStatusChange(repair.id, value as RepairStatus)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Cambiar estado..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getStatusNextOptions(repair.status).map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(status)}
                                  <span>{getStatusLabel(status)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Estado final</span>
                      )}

                      {/* View/Edit Actions */}
                      <Link href={`/repairs/${repair.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          {filteredRepairs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {search || statusFilter !== 'ALL' 
                  ? 'No se encontraron reparaciones'
                  : 'No hay reparaciones registradas'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== 'ALL' 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Crea tu primera orden de reparación'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
