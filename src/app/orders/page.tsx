'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, Eye, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/format'
import { getOrders, getOrderStats } from '@/modules/orders/orders.actions'
import { OrderStatus } from '@prisma/client'

const statusInfo: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }
> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PREPARING: { label: 'Preparando', variant: 'info' },
  SHIPPED: { label: 'Enviado', variant: 'purple' },
  DELIVERED: { label: 'Entregado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'error' },
}

type OrderRow = Awaited<ReturnType<typeof getOrders>>['orders'][number]
type OrderStats = Awaited<ReturnType<typeof getOrderStats>>

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [result, statsData] = await Promise.all([
          getOrders(debouncedSearch || undefined, statusFilter !== 'ALL' ? statusFilter : undefined, page, pageSize),
          page === 1 ? getOrderStats() : Promise.resolve(null),
        ])
        setOrders(result.orders)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        if (statsData) setStats(statsData)
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [debouncedSearch, statusFilter, page])

  if (loading && orders.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <StatCardGrid columns={4}>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
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
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Tienda Online"
        description="Administra los pedidos recibidos desde Tecnicell Store"
        actions={
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        }
      />

      {stats && (
        <StatCardGrid columns={4}>
          <StatCard
            title="Total Pedidos"
            value={stats.total}
            change={`${stats.total} pedidos`}
            icon={Globe}
            color="default"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            change="Esperando confirmación"
            icon={Globe}
            color="warning"
          />
          <StatCard
            title="En Proceso"
            value={stats.confirmed + stats.preparing + stats.shipped}
            change="Confirmados + Preparando + Enviados"
            icon={Globe}
            color="info"
          />
          <StatCard
            title="Ingresos"
            value={formatCurrency(stats.totalRevenue)}
            change="Total no cancelados"
            icon={Globe}
            color="success"
          />
        </StatCardGrid>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar pedidos..." />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="PREPARING">Preparando</SelectItem>
                <SelectItem value="SHIPPED">Enviado</SelectItem>
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
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const info = statusInfo[order.status as OrderStatus]
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(-6)}
                        {order.externalReference && (
                          <div className="text-xs text-muted-foreground">Ref: {order.externalReference}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.clientName}</div>
                        <div className="text-xs text-muted-foreground">{order.clientPhone}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge variant="neutral">{order._count?.items || 0}</StatusBadge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <StatusBadge variant={info.variant} dot>
                          {info.label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(order.createdAt).toLocaleDateString('es-CO')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString('es-CO')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {orders.length === 0 && (
            <EmptyState
              icon={Globe}
              title={search || statusFilter !== 'ALL' ? 'Sin resultados' : 'Sin pedidos online'}
              description={
                search || statusFilter !== 'ALL'
                  ? 'No hay pedidos que coincidan'
                  : 'Los pedidos de Tecnicell Store aparecerán aquí'
              }
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              entity="pedidos"
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
