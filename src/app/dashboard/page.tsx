'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatNumber } from '@/lib/format'
import {
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  BarChart3,
} from 'lucide-react'
import { getDashboardStats } from '@/modules/dashboard/dashboard.actions'
import Link from 'next/link'

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

  const recentRepairs = stats.recentRepairs || []

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen del taller</p>
        </div>
      </div>

      <StatCardGrid>
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
          title="Total Reparaciones"
          value={stats.repairStats?.totalRepairs?.toString() || '0'}
          change={`${formatCurrency(stats.repairStats?.totalLabor || 0)} facturado`}
          icon={BarChart3}
          color="default"
        />
        <StatCard
          title="Clientes Totales"
          value={stats.clientStats?.totalClients?.toString() || '0'}
          change={`+${stats.clientStats?.newClientsThisMonth || 0} nuevos este mes`}
          icon={Users}
          color="purple"
        />
      </StatCardGrid>

      <Card className="card-shadow border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                Reparaciones Recientes
              </CardTitle>
              <CardDescription>Últimas reparaciones registradas</CardDescription>
            </div>
            <Link
              href="/repairs"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRepairs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
              <Wrench className="h-8 w-8 text-muted-foreground/40" />
              <p>No hay reparaciones registradas</p>
              <Link
                href="/repairs/new"
                className="text-primary hover:underline text-xs font-medium"
              >
                Crear primera reparación
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50 -mx-6">
              {recentRepairs.map((repair) => (
                <Link
                  key={repair.id}
                  href={`/repairs/${repair.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors duration-150"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{repair.client?.name || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground truncate">{repair.device}</p>
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
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
