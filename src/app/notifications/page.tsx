'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Wrench, Info, PiggyBank, Package, DollarSign, CheckCheck, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import type { NotificationType } from '@prisma/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { getNotificationData, markAsRead, markAllAsRead } from '@/modules/notifications/notifications.actions'
import { getNotificationTypeLabel } from '@/lib/labels'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string | null
  entityType: string | null
  entityId: string | null
  read: boolean
  createdAt: Date
}

const typeIcons: Record<NotificationType, typeof Bell> = {
  REPAIR_READY: Wrench,
  SYSTEM: Info,
  WEEK_CLOSED: PiggyBank,
  SAVING_GOAL_REACHED: PiggyBank,
  LOW_STOCK: Package,
  BUDGET_ALERT: DollarSign,
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'ahora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function getEntityLink(entityType: string | null, entityId: string | null): string {
  if (!entityType || !entityId) return '#'
  switch (entityType) {
    case 'repair':
      return `/repairs/${entityId}`
    case 'budget_period':
      return '/finances'
    case 'saving_goal':
      return '/finances/goals'
    default:
      return '#'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async (p: number, f: 'all' | 'unread') => {
    setLoading(true)
    const data = await getNotificationData(p, 20)
    const all = data.notifications as Notification[]
    setNotifications(f === 'unread' ? all.filter((n) => !n.read) : all)
    setTotalPages(data.totalPages)
    setUnreadCount(data.unreadCount)
    setTotal(data.total)
    setPage(data.page)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load(page, filter)
  }, [load, page, filter])

  async function handleMarkAll() {
    setMarkingAll(true)
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    setMarkingAll(false)
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await markAsRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    const link = getEntityLink(n.entityType, n.entityId)
    if (link !== '#') {
      router.push(link)
    }
  }

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
            <p className="text-sm text-muted-foreground">
              {total} notificaciones{unreadCount > 0 ? ` · ${unreadCount} sin leer` : ''}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markingAll}>
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCheck className="h-4 w-4 mr-1" />}
            Marcar todo como leído
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setFilter('all'); setPage(1) }}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setFilter('unread'); setPage(1) }}
        >
          No leídas{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-4 border rounded-xl">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No hay notificaciones"
          description={filter === 'unread' ? 'No tienes notificaciones sin leer' : 'Aún no hay notificaciones'}
        />
      ) : (
        <>
          <div className="space-y-2">
            {displayed.map((n) => {
              const Icon = typeIcons[n.type] || Info
              return (
                <Card
                  key={n.id}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-accent/50 ${!n.read ? 'border-l-2 border-l-primary bg-primary/5' : ''}`}
                  onClick={() => void handleClick(n)}
                >
                  <div className={`rounded-full p-2 shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      <Badge variant={n.read ? 'outline' : 'default'} className="shrink-0 text-[10px] h-4">
                        {getNotificationTypeLabel(n.type)}
                      </Badge>
                    </div>
                    {n.message && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}