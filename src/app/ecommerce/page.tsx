'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, ShoppingBag, Eye, Tag, Star, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { getEcommerceStats } from '@/modules/ecommerce/ecommerce.actions'

type EcommerceStats = Awaited<ReturnType<typeof getEcommerceStats>>

export default function EcommercePage() {
  const [stats, setStats] = useState<EcommerceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEcommerceStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <StatCardGrid columns={3}>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </StatCardGrid>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Tecnicell Store"
        description="Panel de administración de la tienda online"
        actions={
          <Link href="/ecommerce/products">
            <Button>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Gestionar Catálogo
            </Button>
          </Link>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Publicados"
          value={stats?.totalPublished || 0}
          change="Productos en tienda"
          icon={Store}
          color="success"
        />
        <StatCard
          title="Visibles"
          value={stats?.totalVisible || 0}
          change="Con stock disponible"
          icon={Eye}
          color="info"
        />
        <StatCard
          title="Destacados"
          value={stats?.featured || 0}
          change="En vitrina principal"
          icon={Star}
          color="warning"
        />
        <StatCard
          title="En Oferta"
          value={stats?.withDiscount || 0}
          change="Con precio rebajado"
          icon={Tag}
          color="purple"
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos sin publicar en tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.totalInventory ?? 0) > 0 ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">
                    {stats?.totalInventory ?? 0} productos del inventario no están en la tienda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrégalos al catálogo para que aparezcan en Tecnicell Store
                  </p>
                </div>
                <Link href="/ecommerce/products">
                  <Button variant="outline" size="sm">
                    Agregar
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos los productos del inventario están en la tienda
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4" />
              Accesos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/orders">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Pedidos recibidos
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Package className="mr-2 h-4 w-4" />
                Inventario
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
