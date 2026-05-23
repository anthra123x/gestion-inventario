'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, EyeOff, Store, Star, ImageOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getEcommerceProducts,
  toggleVisibility,
  createEcommerceProduct,
  deleteEcommerceProduct,
  getProductsWithoutEcommerce,
} from '@/modules/ecommerce/ecommerce.actions'

export default function EcommerceProductsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page])

  async function loadProducts() {
    setLoading(true)
    try {
      const result = await getEcommerceProducts(debouncedSearch || undefined, page, pageSize)
      setProducts(result.products)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleVisibility(id: string, visible: boolean) {
    const result = await toggleVisibility(id, !visible)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    loadProducts()
  }

  async function openAddDialog() {
    const items = await getProductsWithoutEcommerce()
    setAvailableProducts(items)
    setAddOpen(true)
  }

  async function handleAdd(productId: string) {
    const result = await createEcommerceProduct(productId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    setAddOpen(false)
    loadProducts()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const result = await deleteEcommerceProduct(deleteTarget.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    setDeleteOpen(false)
    setDeleteTarget(null)
    loadProducts()
  }

  if (loading && products.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Catálogo Tienda"
        description="Productos publicados en Tecnicell Store"
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar en catálogo..." />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Producto</TableHead>
                  <TableHead>Precios</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {item.media?.[0]?.url ? (
                            <img
                              src={item.media[0].url}
                              alt={item.media[0].alt || ''}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {item.product.name}
                            {item.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          {item.slug && <div className="text-xs text-muted-foreground">/{item.slug}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {item.ecommercePrice ? (
                          <div className="font-semibold">{formatCurrency(item.ecommercePrice)}</div>
                        ) : (
                          <div className="font-semibold">{formatCurrency(item.product.salePrice)}</div>
                        )}
                        {item.compareAtPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(item.compareAtPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={item.product.stock > 0 ? 'success' : 'error'} dot>
                        {item.product.stock}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.badges?.map((badge: string) => (
                          <Badge key={badge} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${item.visible ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
                        />
                        <span className="text-sm">{item.visible ? 'Visible' : 'Oculto'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggleVisibility(item.id, item.visible)}
                          title={item.visible ? 'Ocultar' : 'Publicar'}
                        >
                          {item.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Link href={`/ecommerce/products/${item.id}`}>
                          <Button variant="ghost" size="icon-xs">
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {products.length === 0 && (
            <EmptyState
              icon={Store}
              title={search ? 'Sin resultados' : 'Catálogo vacío'}
              description={search ? 'No hay productos que coincidan' : 'Agrega productos del inventario a la tienda'}
              action={search ? undefined : { label: 'Agregar producto', onClick: openAddDialog }}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              entity="productos"
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>

      {/* Add product dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a la Tienda</DialogTitle>
            <DialogDescription>
              Selecciona un producto del inventario para publicarlo en Tecnicell Store
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {availableProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos los productos ya están en la tienda
              </p>
            ) : (
              availableProducts.map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <button
                  key={p.id}
                  onClick={() => handleAdd(p.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm flex items-center justify-between transition-colors"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.category}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar del catálogo</DialogTitle>
            <DialogDescription>
              ¿Eliminar {deleteTarget?.product?.name} de la tienda? No afecta el inventario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
