'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Package, TrendingUp, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatCardGrid } from '@/components/ui/stat-card'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { getProducts, deleteProduct, getInventoryStockBreakdown } from '@/modules/inventory/inventory.actions'
import { Product, ProductCategory } from '@prisma/client'
import { getStockStatus, getCategoryLabel } from '@/lib/labels'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [stockBreakdown, setStockBreakdown] = useState<{
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
  } | null>(null)
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter, page])

  async function loadProducts() {
    try {
      setLoading(true)
      const [result, breakdown] = await Promise.all([
        getProducts(
          debouncedSearch || undefined,
          categoryFilter !== 'ALL' ? (categoryFilter as ProductCategory) : undefined,
          page,
          pageSize,
        ),
        getInventoryStockBreakdown(),
      ])
      setProducts(result.products)
      setTotalProducts(result.total)
      setTotalPages(result.totalPages)
      setStockBreakdown(breakdown)
    } catch (_error) {
      console.error('Error loading products:', _error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteProduct(product: Product) {
    try {
      const result = await deleteProduct(product.id)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      if (result?.success) {
        toast.success('Producto eliminado')
        await loadProducts()
        setDeleteDialogOpen(false)
        setProductToDelete(null)
      }
    } catch (_error) {
      toast.error('Error al eliminar el producto')
    }
  }

  const stockCounts = stockBreakdown || {
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  }

  if (loading && products.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <StatCardGrid>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </StatCardGrid>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Inventario"
        description="Gestiona tus productos y stock"
        actions={
          <Link href="/inventory/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Productos"
          value={totalProducts}
          change={`${stockCounts.total} productos`}
          icon={Package}
          color="default"
        />
        <StatCard
          title="En Stock"
          value={stockCounts.inStock}
          change="Niveles seguros"
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Stock Bajo"
          value={stockCounts.lowStock}
          change="Necesitan reabastecimiento"
          icon={AlertTriangle}
          color="warning"
        />
        <StatCard
          title="Agotados"
          value={stockCounts.outOfStock}
          change="Sin stock disponible"
          icon={XCircle}
          color="danger"
        />
      </StatCardGrid>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar productos..." />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as ProductCategory | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="ACCESSORY">Accesorios</SelectItem>
                <SelectItem value="REPAIR_PART">Repuestos</SelectItem>
                <SelectItem value="DEVICE">Dispositivos</SelectItem>
                <SelectItem value="OTHER">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold">{product.stock}</div>
                        <div className="text-xs text-muted-foreground">Mín: {product.minStock}</div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(product.salePrice)}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/inventory/${product.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label="Editar producto">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            aria-label="Eliminar producto"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {products.length === 0 && (
            <EmptyState
              icon={Package}
              title={search || categoryFilter !== 'ALL' ? 'Sin resultados' : 'Sin productos'}
              description={
                search || categoryFilter !== 'ALL'
                  ? 'No hay productos que coincidan con tu búsqueda'
                  : 'Crea tu primer producto para comenzar'
              }
              action={
                search || categoryFilter !== 'ALL' ? undefined : { label: 'Crear producto', href: '/inventory/new' }
              }
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalProducts}
              entity="productos"
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar &ldquo;{productToDelete?.name}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => productToDelete && handleDeleteProduct(productToDelete)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
