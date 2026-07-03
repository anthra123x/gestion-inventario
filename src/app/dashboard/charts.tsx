'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3, HardDrive, Package, PieChart } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts'
import { getRepairStatusLabel } from '@/lib/labels'

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'oklch(0.55 0.17 30)',
  IN_PROGRESS: 'oklch(0.5 0.14 200)',
  READY: 'oklch(0.55 0.18 145)',
  DELIVERED: 'oklch(0.45 0.1 20)',
  CANCELLED: 'oklch(0.55 0.01 55)',
}

interface TooltipPayloadEntry {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatter ? formatter(entry.value ?? 0) : entry.value}
        </p>
      ))}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-primary/10 p-1.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function StatusDonut({
  data,
}: {
  data: { status: string; _count: { id: number } }[]
}) {
  const chartData = data.map((d) => ({
    name: getRepairStatusLabel(d.status),
    value: d._count.id,
    color: STATUS_COLORS[d.status] || 'oklch(0.55 0.01 55)',
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <Card className="card-shadow border-border/60">
      <CardHeader className="pb-2">
        <SectionHeader icon={PieChart} title="Estado de Reparaciones" description="Distribución actual" />
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <PieChart className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p>Sin datos</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <ResponsiveContainer width={140} height={140}>
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltip formatter={(v: number) => String(v)} />}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MonthlyBar({
  data,
}: {
  data: { month: string; totalLabor: number; count: number }[]
}) {
  const chartData = data.map((d) => {
    const [year, month] = d.month.split('-')
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return {
      month: monthNames[parseInt(month) - 1],
      Reparaciones: d.count,
    }
  })

  return (
    <Card className="card-shadow border-border/60">
      <CardHeader className="pb-2">
        <SectionHeader icon={BarChart3} title="Reparaciones por Mes" description="Últimos 12 meses" />
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p>Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Reparaciones" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill="var(--color-primary, oklch(0.52 0.16 30))"
                    fillOpacity={0.65 + 0.35 * ((i + 1) / chartData.length)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function TopDevicesBar({
  data,
}: {
  data: { device: string; _count: { id: number } }[]
}) {
  const chartData = data
    .filter((d) => d.device)
    .slice(0, 6)
    .map((d) => ({
      device: d.device.length > 18 ? d.device.slice(0, 18) + '…' : d.device,
      Reparaciones: d._count.id,
    }))

  return (
    <Card className="card-shadow border-border/60">
      <CardHeader className="pb-2">
        <SectionHeader icon={HardDrive} title="Dispositivos más Reparados" description="Top dispositivos" />
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <HardDrive className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p>Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartData.length * 32 + 16}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="device"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={chartData.reduce((w, d) => Math.max(w, d.device.length * 6.5), 60)}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
              />
              <Bar dataKey="Reparaciones" radius={[0, 3, 3, 0]} maxBarSize={18}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill="var(--color-chart-2, oklch(0.6 0.12 50))"
                    fillOpacity={0.7 + 0.3 * (1 - i / chartData.length)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function TopPartsBar({
  data,
}: {
  data: {
    _sum: { quantity: number | null; total: number | null }
    part: { name: string } | undefined
  }[]
}) {
  const chartData = data
    .filter((d) => d.part)
    .slice(0, 6)
    .map((d) => ({
      name: (d.part?.name || '').length > 18 ? (d.part?.name || '').slice(0, 18) + '…' : (d.part?.name || ''),
      Cantidad: d._sum.quantity || 0,
    }))

  return (
    <Card className="card-shadow border-border/60">
      <CardHeader className="pb-2">
        <SectionHeader icon={Package} title="Repuestos más Usados" description="Últimos 30 días" />
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <Package className="h-8 w-8 mb-2 text-muted-foreground/40" />
            <p>Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartData.length * 32 + 16}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={chartData.reduce((w, d) => Math.max(w, d.name.length * 6.5), 60)}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
              />
              <Bar dataKey="Cantidad" radius={[0, 3, 3, 0]} maxBarSize={18}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill="var(--color-chart-5, oklch(0.35 0.08 55))"
                    fillOpacity={0.7 + 0.3 * (1 - i / chartData.length)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
