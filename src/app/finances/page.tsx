'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import {
  getFinanceSummaryAction,
  getDailySummaryAction,
  getPeriodSummaryAction,
  closeWeekAction,
} from '@/modules/finance/finance.actions'
import {
  DollarSign, TrendingUp, TrendingDown, PiggyBank, Wallet, BarChart3, PieChart, Target, CalendarDays, Sun, type LucideIcon,
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart as RePieChart, Pie,
} from 'recharts'
import Link from 'next/link'
import { toast } from 'sonner'

/* eslint-disable @typescript-eslint/no-explicit-any */

const DAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return DAY_LABELS[d.getDay()]
}

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number; payload: { month: string } }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-muted-foreground mb-1">{label || payload[0].payload.month}</p>
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

const CATEGORY_COLORS = ['var(--color-primary)', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#6b7280']

export default function FinancesPage() {
  const [summary, setSummary] = useState<any>(null)
  const [dailySummary, setDailySummary] = useState<any>(null)
  const [periodSummary, setPeriodSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const todayStr = new Date().toLocaleDateString('en-CA')
      const [s, d, p] = await Promise.all([
        getFinanceSummaryAction(todayStr),
        getDailySummaryAction(todayStr),
        getPeriodSummaryAction(todayStr),
      ])
      setSummary(s)
      setDailySummary(d)
      setPeriodSummary(p)
    } catch {
      setError('Error al cargar datos financieros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleCloseWeek(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClosing(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await closeWeekAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success || 'Semana cerrada exitosamente')
        setDialogOpen(false)
        loadData()
      }
    } catch {
      toast.error('Error al cerrar la semana')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-56 mt-1" /></div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container py-6">
        <EmptyState icon={Wallet} title="Error al cargar" description={error} />
      </div>
    )
  }

  const today = new Date()
  const todayStr = today.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const savingsProgress = summary?.savingGoals?.length > 0
    ? summary.savingGoals.reduce((sum: number, g: any) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / summary.savingGoals.length
    : 0

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-sm text-muted-foreground">Resumen financiero personal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Link href="/finances/transactions/new">+ Nueva Transacción</Link>
          </Button>
          <Button variant="outline" size="sm">
            <Link href="/finances/transactions">Ver Todas</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
        </TabsList>

        {/* ─── TAB DIARIO ─── */}
        <TabsContent value="daily">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold capitalize">{todayStr}</p>
                <p className="text-[11px] text-muted-foreground">Resumen del día</p>
              </div>
            </div>

            <StatCardGrid>
              <StatCard
                title="Ingresos Hoy"
                value={formatCurrency(dailySummary?.totalIncome ?? 0)}
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="Gastos Hoy"
                value={formatCurrency(dailySummary?.totalExpenses ?? 0)}
                icon={TrendingDown}
                color="danger"
              />
              <StatCard
                title="Balance del Día"
                value={formatCurrency(dailySummary?.balance ?? 0)}
                icon={Wallet}
                color={(dailySummary?.balance ?? 0) >= 0 ? 'success' : 'danger'}
              />
              <StatCard
                title="Transacciones Hoy"
                value={dailySummary?.transactions?.length ?? 0}
                icon={Sun}
                color="info"
              />
            </StatCardGrid>

            {dailySummary?.expenseByCategory?.length > 0 && (
              <Card className="card-shadow border-border/60">
                <CardHeader><SectionHeader icon={PieChart} title="Gastos por Categoría" description="Hoy" /></CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <ResponsiveContainer width="100%" height={140}>
                      <RePieChart>
                        <Pie innerRadius={38} outerRadius={62} paddingAngle={2} dataKey="amount" data={dailySummary.expenseByCategory}>
                          {dailySummary.expenseByCategory.map((_: any, i: number) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1">
                      {dailySummary.expenseByCategory.slice(0, 5).map((item: any, i: number) => (
                        <div key={item.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                            <span className="text-muted-foreground">{item.category}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {dailySummary?.transactions?.length > 0 ? (
              <Card className="card-shadow border-border/60">
                <CardHeader><SectionHeader icon={Wallet} title="Transacciones del Día" description="Movimientos registrados hoy" /></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dailySummary.transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.category?.name || 'Sin categoría'}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-shadow border-border/60">
                <CardContent>
                  <EmptyState icon={Sun} title="Sin movimientos hoy" description="No hay transacciones registradas para el día de hoy." />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB SEMANAL ─── */}
        <TabsContent value="weekly">
          <div className="space-y-6">
            {periodSummary?.period && (
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Semana del {new Date(periodSummary.period.startDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} al {new Date(periodSummary.period.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Periodo semanal activo</p>
                </div>
              </div>
            )}

            <StatCardGrid columns={4}>
              <StatCard
                title="Ingresos Semana"
                value={formatCurrency(periodSummary?.totalIncome ?? 0)}
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="Gastos Semana"
                value={formatCurrency(periodSummary?.totalExpenses ?? 0)}
                icon={TrendingDown}
                color="danger"
              />
              <StatCard
                title="Balance"
                value={formatCurrency(periodSummary?.balance ?? 0)}
                icon={Wallet}
                color={(periodSummary?.balance ?? 0) >= 0 ? 'success' : 'danger'}
              />
              <StatCard
                title="Neto (después de ahorro)"
                value={formatCurrency(periodSummary?.netAfterSavings ?? 0)}
                icon={PiggyBank}
                color={(periodSummary?.netAfterSavings ?? 0) >= 0 ? 'success' : 'danger'}
              />
            </StatCardGrid>

            {periodSummary?.dailyBreakdown?.length > 0 && (
              <Card className="card-shadow border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={BarChart3} title="Resumen Diario" description="Ingresos y gastos por día" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartsBarChart data={periodSummary.dailyBreakdown} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => getDayLabel(v)} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                      <Bar dataKey="income" name="Ingresos" radius={[3, 3, 0, 0]} maxBarSize={20} fill="#22c55e" />
                      <Bar dataKey="expenses" name="Gastos" radius={[3, 3, 0, 0]} maxBarSize={20} fill="#ef4444" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {periodSummary?.period?.savingsAllocated > 0 && (
              <Card className="card-shadow border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <PiggyBank className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ahorro asignado esta semana</p>
                      <p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(periodSummary.period.savingsAllocated)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  Cerrar Semana
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cerrar Semana</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCloseWeek} className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="savingsTarget">Meta de ahorro (opcional)</Label>
                      <Input id="savingsTarget" name="savingsTarget" type="number" min={0} placeholder="0" className="mt-1.5" />
                      <p className="text-[11px] text-muted-foreground mt-1">Si no se especifica, se ahorrará el balance completo.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={closing}>
                        {closing ? 'Cerrando...' : 'Cerrar Semana'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB MENSUAL ─── */}
        <TabsContent value="monthly">
          <div className="space-y-6">
            <StatCardGrid>
              <StatCard
                title="Ingresos este mes"
                value={formatCurrency(summary?.totalIncome ?? 0)}
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="Gastos este mes"
                value={formatCurrency(summary?.totalExpenses ?? 0)}
                icon={TrendingDown}
                color="danger"
              />
              <StatCard
                title="Balance"
                value={formatCurrency(summary?.balance ?? 0)}
                icon={Wallet}
                color={(summary?.balance ?? 0) >= 0 ? 'success' : 'danger'}
              />
              <StatCard
                title="Metas de Ahorro"
                value={`${summary?.savingGoals?.length ?? 0}`}
                change={summary?.savingGoals?.length > 0 ? `${Math.round(savingsProgress)}% de progreso promedio` : undefined}
                icon={PiggyBank}
                color="purple"
              />
            </StatCardGrid>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
              <Card className="card-shadow border-border/60 xl:col-span-2">
                <CardHeader><SectionHeader icon={BarChart3} title="Balance Mensual" description="Últimos 12 meses" /></CardHeader>
                <CardContent>
                  {(!summary?.monthlyData || summary.monthlyData.length === 0) ? (
                    <EmptyState icon={BarChart3} title="Sin datos" description="Aún no hay transacciones registradas." />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RechartsBarChart data={summary.monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                        <Bar dataKey="income" name="Ingresos" radius={[3, 3, 0, 0]} maxBarSize={24} fill="#22c55e" />
                        <Bar dataKey="expenses" name="Gastos" radius={[3, 3, 0, 0]} maxBarSize={24} fill="#ef4444" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="card-shadow border-border/60">
                <CardHeader><SectionHeader icon={PieChart} title="Gastos por Categoría" description="Este mes" /></CardHeader>
                <CardContent>
                  {(!summary?.expenseByCategory || summary.expenseByCategory.length === 0) ? (
                    <EmptyState icon={PieChart} title="Sin gastos" description="No hay gastos este mes." />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <ResponsiveContainer width="100%" height={140}>
                        <RePieChart>
                          <Pie innerRadius={38} outerRadius={62} paddingAngle={2} dataKey="amount" data={summary.expenseByCategory}>
                            {summary.expenseByCategory.map((_: any, i: number) => (
                              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1">
                        {summary.expenseByCategory.slice(0, 5).map((item: any, i: number) => (
                          <div key={item.category} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
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

              <Card className="card-shadow border-border/60">
                <CardHeader><SectionHeader icon={Target} title="Metas de Ahorro" description="Progreso" /></CardHeader>
                <CardContent>
                  {(!summary?.savingGoals || summary.savingGoals.length === 0) ? (
                    <EmptyState icon={PiggyBank} title="Sin metas" description="Crea tu primera meta de ahorro." action={{ label: 'Crear Meta', href: '/finances/goals' }} />
                  ) : (
                    <div className="space-y-3">
                      {summary.savingGoals.slice(0, 3).map((goal: any) => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                        return (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium truncate">{goal.name}</span>
                              <span className="text-muted-foreground">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      {summary.savingGoals.length > 3 && (
                        <Link href="/finances/goals" className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                          Ver todas
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="card-shadow border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Wallet} title="Últimas Transacciones" description="Las 5 más recientes" />
                  <Link href="/finances/transactions" className="text-xs text-primary hover:underline">Ver todas</Link>
                </div>
              </CardHeader>
              <CardContent>
                {(!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
                  <EmptyState icon={Wallet} title="Sin transacciones" description="Aún no hay transacciones registradas." />
                ) : (
                  <div className="space-y-2">
                    {summary.recentTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.category?.name || 'Sin categoría'} · {new Date(tx.date).toLocaleDateString('es-CO')}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
