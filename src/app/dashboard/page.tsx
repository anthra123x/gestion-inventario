'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatNumber } from '@/lib/format'
import { Store, Users, ShoppingCart, AlertTriangle, ArrowRight, Package, DollarSign } from 'lucide-react'
import { getDashboardStats } from '@/modules/dashboard/dashboard.actions'
import Link from 'next/link'
import { PaymentDonut, SalesMonthlyBar, TopProductsBar, LowStockList } from './charts'

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>

const paymentLabel: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}

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
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="card-shadow border-border/60">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-[140px] w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="card-shadow">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-1">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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

  const recentSales = stats.recentSales || []
  const lowStock = stats.lowStockProducts || []

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 shadow-sm shadow-primary/10">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen de la tienda</p>
        </div>
      </div>

      <StatCardGrid>
        <StatCard
          title="Ventas Hoy"
          value={formatNumber(stats.salesToday?.count || 0)}
          change={`${formatCurrency(stats.salesToday?.total || 0)} en ventas`}
          icon={ShoppingCart}
          color="success"
          href="/sales"
        />
        <StatCard
          title="Ingresos Hoy"
          value={formatCurrency(stats.incomeToday || 0)}
          change="Ingresos registrados hoy"
          icon={DollarSign}
          color="warning"
        />
        <StatCard
          title="Productos"
          value={formatNumber(stats.totalProducts || 0)}
          change={`${lowStock.length} con stock bajo`}
          icon={Package}
          color="default"
          href="/inventory"
        />
        <StatCard
          title="Clientes Totales"
          value={stats.clientStats?.totalClients?.toString() || '0'}
          change={`+${stats.clientStats?.newClientsThisMonth || 0} nuevos este mes`}
          icon={Users}
          color="purple"
          href="/clients"
        />
      </StatCardGrid>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-1">
          <PaymentDonut data={stats.salesByPayment || []} />
        </div>
        <div className="xl:col-span-1">
          <SalesMonthlyBar data={stats.salesByMonth || []} />
        </div>
        <div className="xl:col-span-1">
          <TopProductsBar data={stats.topProducts || []} />
        </div>
        <div className="xl:col-span-1">
          <LowStockList data={lowStock} />
        </div>
      </div>

      <Card className="card-shadow-warm border-border/60 hover:card-shadow-warm-md transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5 shadow-sm shadow-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <span>Ventas Recientes</span>
              </CardTitle>
              <CardDescription>Últimas ventas registradas</CardDescription>
            </div>
            <Link
              href="/sales/history"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
              <p>No hay ventas registradas</p>
              <Link href="/sales" className="text-primary hover:underline text-xs font-medium transition-colors duration-200">
                Registrar primera venta
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50 -mx-6">
              {recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sale.client?.name || 'Cliente mostrador'}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono tabular-nums">
                      {sale.invoiceNumber} · {paymentLabel[sale.paymentMethod] || sale.paymentMethod}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(sale.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
