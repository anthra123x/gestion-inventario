'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Eye,
  Trash2,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CreditCard,
  PiggyBank,
  TrendingDown,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { getSales, getSalesStats, deleteSale } from '@/modules/sales/sales.actions'
import { PaymentMethod } from '@prisma/client'
import { getPaymentMethodLabel, getPaymentMethodColor } from '@/lib/labels'

interface SaleListItem {
  id: string
  total: number
  paymentMethod: string
  notes: string | null
  createdAt: Date
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  clientAddress: string | null
  client: { id: string; name: string; phone: string | null } | null
  user: { name: string } | null
  _count: { saleItems: number }
}

interface SalesStats {
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  salesByPaymentMethod: Array<{ paymentMethod: string; _count: { id: number }; _sum: { total: number | null } }>
  topProducts: Array<{ productId: string; _sum: { quantity: number | null; total: number | null }; product: { id: string; name: string } | undefined }>
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleListItem[]>([])
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [totalSales, setTotalSales] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [salesResult, statsData] = await Promise.all([
          getSales(debouncedSearch || undefined, undefined, undefined, page, pageSize),
          page === 1 ? getSalesStats() : Promise.resolve(null),
        ])
        setSales(salesResult.sales)
        setTotalSales(salesResult.total)
        setTotalPages(salesResult.totalPages)
        if (statsData) setStats(statsData)
      } catch (error) {
        console.error('Error loading sales:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [debouncedSearch, paymentFilter, page])

  async function handleDelete(id: string) {
    setIsDeleting(true)
    try {
      const result = await deleteSale(id)
      if (result.success) {
        setSales((prev) => prev.filter((s) => s.id !== id))
        setTotalSales((prev) => prev - 1)
      }
    } catch (_error) {
      console.error('Error deleting sale')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading && sales.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-24 mb-2" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <StatCardGrid columns={4}>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </StatCardGrid>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
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
        title="Ventas"
        description="Gestiona las ventas del negocio"
        actions={
          <Link href="/sales/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
            </Button>
          </Link>
        }
      />

      {stats && (
        <>
          <StatCardGrid columns={4}>
            <StatCard
              title="Total Ventas"
              value={stats.totalSales}
              change={`${stats.totalSales} transacciones`}
              icon={ShoppingCart}
              color="default"
            />
            <StatCard
              title="Ingresos Totales"
              value={formatCurrency(stats.totalRevenue)}
              change={`Promedio: ${formatCurrency(stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0)}`}
              icon={DollarSign}
              color="success"
            />
            <StatCard
              title="Ganancia Bruta"
              value={formatCurrency(stats.totalProfit || 0)}
              change={`Margen: ${stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%`}
              icon={PiggyBank}
              color="success"
            />
            <StatCard
              title="Método Popular"
              value={
                stats.salesByPaymentMethod.length > 0
                  ? getPaymentMethodLabel(stats.salesByPaymentMethod[0].paymentMethod)
                  : 'N/A'
              }
              change={`${stats.salesByPaymentMethod[0]?._count || 0} ventas`}
              icon={CreditCard}
              color="purple"
            />
          </StatCardGrid>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4" />
                Costo Invertido
              </div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalCost || 0)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Margen
              </div>
              <div className="text-xl font-bold text-blue-600">
                {stats.totalRevenue > 0 ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Promedio/Venta
              </div>
              <div className="text-xl font-bold">
                {formatCurrency(stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0)}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <PiggyBank className="h-4 w-4" />
                Ganancia/Promedio
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(stats.totalSales > 0 ? stats.totalProfit / stats.totalSales : 0)}
              </div>
            </div>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar ventas..." />
            </div>
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentMethod | 'ALL')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
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
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">#{sale.id.slice(-6)}</TableCell>
                    <TableCell>
                      {sale.client ? (
                        <div>
                          <div className="font-medium">{sale.client.name}</div>
                          <div className="text-xs text-muted-foreground">{sale.client.phone}</div>
                        </div>
                      ) : sale.clientName ? (
                        <div>
                          <div className="font-medium">{sale.clientName}</div>
                          {sale.clientPhone && <div className="text-xs text-muted-foreground">{sale.clientPhone}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Cliente ocasional</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge variant="neutral">{sale._count?.saleItems || 0}</StatusBadge>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getPaymentMethodColor(sale.paymentMethod) as
                            | 'default'
                            | 'secondary'
                            | 'outline'
                            | 'destructive'
                        }
                      >
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(sale.createdAt).toLocaleDateString('es-CO')}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/sales/${sale.id}`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Dialog>
                          <DialogTrigger>
                            <Button variant="ghost" size="icon-sm" aria-label="Eliminar venta" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Eliminar Venta</DialogTitle>
                              <DialogDescription>
                                ¿Estás seguro de eliminar esta venta? El stock de los productos será restaurado automáticamente. Esta acción no se puede deshacer.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogTrigger>
                                <Button variant="outline" disabled={isDeleting}>
                                  Cancelar
                                </Button>
                              </DialogTrigger>
                              <Button variant="destructive" onClick={() => handleDelete(sale.id)} disabled={isDeleting}>
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sales.length === 0 && (
            <EmptyState
              icon={Receipt}
              title={search || paymentFilter !== 'ALL' ? 'Sin resultados' : 'Sin ventas'}
              description={
                search || paymentFilter !== 'ALL'
                  ? 'No hay ventas que coincidan con tu búsqueda'
                  : 'Registra tu primera venta para comenzar'
              }
              action={search || paymentFilter !== 'ALL' ? undefined : { label: 'Crear venta', href: '/sales/new' }}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalSales}
              entity="ventas"
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
