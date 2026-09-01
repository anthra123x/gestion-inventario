'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import { getBusinessFinanceReportAction } from '@/modules/finance/finance.actions'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Layers,
  PiggyBank,
  BarChart3,
  PieChart,
  CreditCard,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts'
import type { BusinessFinanceReport, FinancePeriodKind } from '@/modules/finance/finance.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

const DAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return DAY_LABELS[d.getDay()]
}

const CATEGORY_COLORS = [
  'var(--color-primary)',
  '#22c55e',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#6b7280',
]

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number; payload: { date?: string; month?: string } }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const heading = label || payload[0].payload.date || payload[0].payload.month || ''
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-muted-foreground mb-1">{heading}</p>
      {payload.map((entry, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const PERIOD_LABELS: Record<FinancePeriodKind, string> = {
  day: 'Hoy',
  week: 'Esta Semana',
  month: 'Este Mes',
}

function formatPeriodRange(report: BusinessFinanceReport) {
  const { startDate, endDate } = report
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  if (report.kind === 'day') {
    return startDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (report.kind === 'week') {
    return `Semana del ${startDate.toLocaleDateString('es-CO', opts)} al ${endDate.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }
  return startDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

function PeriodStats({ report }: { report: BusinessFinanceReport }) {
  const { sales, expenses, summary } = report
  return (
    <StatCardGrid>
      <StatCard
        title="Ventas"
        value={formatCurrency(sales.total)}
        change={`${sales.count} ventas`}
        icon={ShoppingCart}
        color="success"
      />
      <StatCard
        title="Costo de Mercancía"
        value={formatCurrency(sales.cogs)}
        icon={Layers}
        color="purple"
      />
      <StatCard
        title="Ganancia Bruta"
        value={formatCurrency(sales.grossProfit)}
        change={`${sales.grossMargin.toFixed(1)}% de margen`}
        icon={TrendingUp}
        color="info"
      />
      <StatCard
        title="Gastos Operativos"
        value={formatCurrency(expenses.total)}
        change={`${expenses.count} gastos`}
        icon={TrendingDown}
        color="danger"
      />
      <StatCard
        title="Ganancia Neta"
        value={formatCurrency(summary.netProfit)}
        icon={Wallet}
        color={summary.netProfit >= 0 ? 'success' : 'danger'}
      />
      <StatCard
        title="Balance (caja)"
        value={formatCurrency(summary.balance)}
        icon={PiggyBank}
        color={summary.balance >= 0 ? 'success' : 'danger'}
      />
    </StatCardGrid>
  )
}

function ReportSection({ report }: { report: BusinessFinanceReport }) {
  const { sales, expenses, summary, byDay, paymentMethods } = report

  return (
    <div className="space-y-6">
      <PeriodStats report={report} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <SectionHeader icon={BarChart3} title="Evolución Diaria" description="Ventas vs. Gastos por día" />
          </CardHeader>
          <CardContent>
            {byDay.length === 0 ? (
              <EmptyState icon={BarChart3} title="Sin movimiento" description="No hay ventas ni gastos en este período." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RechartsBarChart data={byDay} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => getDayLabel(v)}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                  <Bar dataKey="sales" name="Ventas" radius={[3, 3, 0, 0]} maxBarSize={20} fill="#22c55e" />
                  <Bar dataKey="expenses" name="Gastos" radius={[3, 3, 0, 0]} maxBarSize={20} fill="#ef4444" />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardHeader>
            <SectionHeader icon={PieChart} title="Gastos por Categoría" description="Distribución de gastos" />
          </CardHeader>
          <CardContent>
            {expenses.byCategory.length === 0 ? (
              <EmptyState icon={PieChart} title="Sin gastos" description="No hay gastos registrados en este período." />
            ) : (
              <div className="flex flex-col gap-3">
                <ResponsiveContainer width="100%" height={150}>
                  <RePieChart>
                    <Pie
                      innerRadius={42}
                      outerRadius={66}
                      paddingAngle={2}
                      dataKey="amount"
                      data={expenses.byCategory}
                    >
                      {expenses.byCategory.map((_: any, i: number) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {expenses.byCategory.slice(0, 5).map((item: any, i: number) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.category}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <SectionHeader icon={CreditCard} title="Métodos de Pago" description="Ventas por método de pago" />
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <EmptyState icon={CreditCard} title="Sin ventas" description="No hay ventas en este período." />
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div key={pm.method}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{PAYMENT_LABELS[pm.method] || pm.method}</span>
                      <span className="text-muted-foreground">
                        {pm.count} venta{pm.count !== 1 ? 's' : ''} · {formatCurrency(pm.total)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${sales.total > 0 ? (pm.total / sales.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardHeader>
            <SectionHeader icon={Receipt} title="Resumen del Período" description="Ganancias y flujo de caja" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ventas totales</span>
                <span className="font-semibold tabular-nums text-emerald-600">{formatCurrency(sales.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Costo de mercancía vendida</span>
                <span className="font-semibold tabular-nums text-muted-foreground">-{formatCurrency(sales.cogs)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="font-medium">Ganancia bruta</span>
                <span className="font-semibold tabular-nums">{formatCurrency(sales.grossProfit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gastos operativos</span>
                <span className="font-semibold tabular-nums text-red-600">-{formatCurrency(expenses.total)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="font-medium">Ganancia neta</span>
                <span className="font-bold tabular-nums">{formatCurrency(summary.netProfit)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="font-medium">Balance (entradas - salidas)</span>
                <span className="font-bold tabular-nums">{formatCurrency(summary.balance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<FinancePeriodKind>('day')
  const [reports, setReports] = useState<Record<FinancePeriodKind, BusinessFinanceReport | null>>({
    day: null,
    week: null,
    month: null,
  })
  const [loading, setLoading] = useState<Record<FinancePeriodKind, boolean>>({
    day: true,
    week: true,
    month: true,
  })
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async (kind: FinancePeriodKind) => {
    setLoading((prev) => ({ ...prev, [kind]: true }))
    try {
      const todayStr = new Date().toLocaleDateString('en-CA')
      const data = await getBusinessFinanceReportAction(kind, todayStr)
      setReports((prev) => ({ ...prev, [kind]: data }))
    } catch {
      setError('Error al cargar datos financieros')
    } finally {
      setLoading((prev) => ({ ...prev, [kind]: false }))
    }
  }, [])

  useEffect(() => {
    loadReport('day')
    loadReport('week')
    loadReport('month')
  }, [loadReport])

  const current = reports[activeTab]
  const isLoading = loading[activeTab]

  if (error) {
    return <EmptyState icon={Wallet} title="Error al cargar" description={error} />
  }

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-sm text-muted-foreground">Reporte financiero del negocio</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FinancePeriodKind)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="day">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground capitalize">
            {current ? formatPeriodRange(current) : PERIOD_LABELS[activeTab]}
          </p>
        </div>

        {activeTab === 'day' && (
          <TabsContent value="day" className="mt-5">
            {isLoading || !current ? (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <Skeleton className="h-72 rounded-xl" />
                  <Skeleton className="h-72 rounded-xl" />
                </div>
              </div>
            ) : (
              <ReportSection report={current} />
            )}
          </TabsContent>
        )}

        {activeTab === 'week' && (
          <TabsContent value="week" className="mt-5">
            {isLoading || !current ? (
              <Skeleton className="h-72 rounded-xl" />
            ) : (
              <ReportSection report={current} />
            )}
          </TabsContent>
        )}

        {activeTab === 'month' && (
          <TabsContent value="month" className="mt-5">
            {isLoading || !current ? (
              <Skeleton className="h-72 rounded-xl" />
            ) : (
              <ReportSection report={current} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
