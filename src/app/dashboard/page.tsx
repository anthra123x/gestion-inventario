'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatNumber } from '@/lib/format'
import {
  Package,
  ShoppingCart,
  Wrench,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { getDashboardStats } from '@/modules/dashboard/dashboard.actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
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
      <div className="page-container py-6 min-h-screen space-y-6">
        <Skeleton className="h-9 w-48" />
        <StatCardGrid>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3 animate-stagger-content">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
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
      <div className="page-container py-6">
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar"
          description="No se pudieron cargar las estadísticas del dashboard"
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      </div>
    )
  }

  const lowStockProducts = stats.lowStockProducts || []
  const recentSales = stats.recentSales || []
  const recentRepairs = stats.recentRepairs || []

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general del negocio"
        actions={
          <Link href="/sales/new">
            <Button>
              <TrendingUp className="mr-2 h-4 w-4" />
              Nueva Venta
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <StatCardGrid className="animate-stagger-1">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(stats.salesComparison?.todayTotal || 0)}
          change={(() => {
            const change = stats.salesComparison?.change ?? 0
            const direction = change >= 0 ? '↑' : '↓'
            const text = Math.abs(change).toFixed(1)
            return `${direction} ${text}% vs ayer (${formatCurrency(stats.salesComparison?.yesterdayTotal || 0)})`
          })()}
          icon={stats.salesComparison?.change >= 0 ? TrendingUp : TrendingDown}
          color={stats.salesComparison?.change >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(stats.salesStats?.totalRevenue || 0)}
          change={`${formatNumber(stats.salesStats?.totalSales || 0)} ventas este mes`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Reparaciones Activas"
          value={stats.repairStats?.activeRepairs?.toString() || '0'}
          change={`${stats.repairStats?.totalRepairs || 0} reparaciones totales`}
          icon={Wrench}
          color="warning"
        />
        <StatCard
          title="Reparaciones Listas"
          value={formatNumber(stats.repairsReady || 0)}
          change="Listas para entregar"
          icon={CheckCircle2}
          color="success"
          href="/repairs?filter=ready"
        />
        <StatCard
          title="Stock Bajo"
          value={formatNumber(stats.lowStockProducts?.length || 0)}
          change="Productos por reabastecer"
          icon={Package}
          color="warning"
        />
        <StatCard
          title="Clientes Totales"
          value={stats.clientStats?.totalClients?.toString() || '0'}
          change={`+${stats.clientStats?.newClientsThisMonth || 0} nuevos este mes`}
          icon={Users}
          color="purple"
        />
      </StatCardGrid>

      {/* Activity Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Low Stock Alert */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                Stock Bajo
              </CardTitle>
              <Link
                href="/inventory?filter=low"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Todo el stock está en niveles seguros</p>
            ) : (
              <div className="space-y-1">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2.5 pl-3 -mx-3 rounded-r-lg border-l-2 border-l-amber-400 hover:bg-muted/30 transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Stock: {product.stock} / Min: {product.minStock}
                      </p>
                    </div>
                    <StatusBadge variant="warning" dot>
                      {product.stock} und
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                </div>
                Ventas Recientes
              </CardTitle>
              <Link href="/sales" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription>Últimas ventas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay ventas registradas</p>
            ) : (
              <div className="space-y-1">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between py-2.5 pl-3 -mx-3 rounded-r-lg border-l-2 border-l-emerald-400 hover:bg-muted/30 transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sale.client?.name || 'Cliente ocasional'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(sale.total || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Repairs */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
                Reparaciones
              </CardTitle>
              <Link href="/repairs" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription>Estado de reparaciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay reparaciones activas</p>
            ) : (
              <div className="space-y-1">
                {recentRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="flex items-center justify-between py-2.5 pl-3 -mx-3 rounded-r-lg border-l-2 border-l-blue-400 hover:bg-muted/30 transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{repair.client?.name || 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground">{repair.device}</p>
                    </div>
                    <StatusBadge
                      variant={
                        repair.status === 'READY'
                          ? 'success'
                          : repair.status === 'IN_PROGRESS'
                            ? 'info'
                            : repair.status === 'DELIVERED'
                              ? 'purple'
                              : 'neutral'
                      }
                      dot
                      pulse={repair.status === 'IN_PROGRESS'}
                    >
                      {repair.status === 'READY'
                        ? 'Listo'
                        : repair.status === 'IN_PROGRESS'
                          ? 'En progreso'
                          : repair.status === 'RECEIVED'
                            ? 'Recibido'
                            : repair.status === 'DELIVERED'
                              ? 'Entregado'
                              : repair.status}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
