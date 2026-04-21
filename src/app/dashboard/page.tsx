'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber } from '@/lib/format'
import { Package, ShoppingCart, Wrench, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { getDashboardStats } from '@/modules/dashboard/dashboard.actions'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-6 min-h-screen space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-gray-600">Error al cargar las estadísticas</p>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Ventas del Mes',
      value: formatCurrency(stats.salesStats?.totalRevenue || 0),
      change: `${formatNumber(stats.salesStats?.totalSales || 0)} ventas`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Productos en Stock',
      value: formatNumber(stats.lowStockProducts?.length || 0),
      change: `${formatNumber(stats.lowStockProducts?.filter((p: any) => p.stock <= p.minStock).length || 0)} con stock bajo`,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Reparaciones Activas',
      value: stats.repairStats?.activeRepairs?.toString() || '0',
      change: `${stats.repairStats?.totalRepairs || 0} totales`,
      icon: Wrench,
      color: 'text-orange-600',
    },
    {
      title: 'Clientes Totales',
      value: stats.clientStats?.totalClients?.toString() || '0',
      change: `+${stats.clientStats?.newClientsThisMonth || 0} nuevos clientes`,
      icon: Users,
      color: 'text-purple-600',
    },
  ]

  const lowStockProducts = stats.lowStockProducts || []

  const recentSales = stats.recentSales || []

  const recentRepairs = stats.recentRepairs || []

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Resumen general del negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stock Bajo
            </CardTitle>
            <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product: any) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.stock} / Mínimo: {product.minStock}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    {product.stock} unidades
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>Últimas ventas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sale.client?.name || 'Cliente ocasional'}</p>
                    <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('es-CO')}</p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(sale.total || 0)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Repairs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Reparaciones Recientes
            </CardTitle>
            <CardDescription>Estado de las reparaciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRepairs.map((repair: any) => (
                <div key={repair.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{repair.client?.name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">{repair.device}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    repair.status === 'READY' ? 'bg-green-100 text-green-800' :
                    repair.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {repair.status === 'READY' ? 'Listo' :
                     repair.status === 'IN_PROGRESS' ? 'En progreso' :
                     repair.status === 'RECEIVED' ? 'Recibido' :
                     repair.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
