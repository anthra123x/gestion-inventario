'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, ShoppingCart, TrendingUp, DollarSign, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getSales, getSalesStats } from '@/modules/sales/sales.actions'
import { PaymentMethod } from '@prisma/client'

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterSales()
  }, [sales, search, paymentFilter])

  async function loadData() {
    try {
      const [salesData, statsData] = await Promise.all([
        getSales(),
        getSalesStats(),
      ])
      setSales(salesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterSales() {
    let filtered = sales

    if (search) {
      filtered = filtered.filter(sale =>
        sale.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        sale.client?.phone?.toLowerCase().includes(search.toLowerCase()) ||
        sale.notes?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (paymentFilter !== 'ALL') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentFilter)
    }

    return filtered
  }

  function getPaymentMethodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      MERCADO_PAGO: 'Mercado Pago (antiguo)',
    }
    return labels[method] || method
  }

  function getPaymentMethodColor(method: string) {
    const colors: Record<string, string> = {
      CASH: 'default',
      CARD: 'secondary',
      TRANSFER: 'outline',
      MERCADO_PAGO: 'destructive',
    }
    return colors[method] || 'default'
  }

  const filteredSales = filterSales()

  if (loading) {
    return (
      <div className="container mx-auto py-6 min-h-screen space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-24 mb-2" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
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
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-gray-600">Gestiona las ventas del negocio</p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Método Popular</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.salesByPaymentMethod.length > 0 
                  ? getPaymentMethodLabel(stats.salesByPaymentMethod[0].paymentMethod)
                  : 'N/A'
                }
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
                  placeholder="Buscar ventas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentMethod | 'ALL')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los métodos</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas ({filteredSales.length})</CardTitle>
          <CardDescription>
            Historial completo de ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">#{sale.id.slice(-6)}</TableCell>
                  <TableCell>
                    {sale.client ? (
                      <div>
                        <div className="font-medium">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.phone}</div>
                      </div>
                    ) : sale.clientName ? (
                      <div>
                        <div className="font-medium">{sale.clientName}</div>
                        {sale.clientPhone && (
                          <div className="text-sm text-gray-500">{sale.clientPhone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Cliente ocasional</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sale._count?.saleItems || 0} producto{(sale._count?.saleItems || 0) !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${sale.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getPaymentMethodColor(sale.paymentMethod) as any}>
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(sale.createdAt).toLocaleDateString()}
                      <div className="text-gray-500">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/sales/${sale.id}/print`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {search || paymentFilter !== 'ALL' 
                  ? 'No se encontraron ventas'
                  : 'No hay ventas registradas'
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || paymentFilter !== 'ALL' 
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Registra tu primera venta para comenzar'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
