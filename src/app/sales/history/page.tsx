'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Eye, Ban, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { getSales, cancelSale } from '@/modules/sales/sales.actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Sale {
  id: string
  invoiceNumber: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  saleDate: Date
  client: { id: string; name: string; phone: string | null } | null
  items: Array<{ id: string; quantity: number; total: number; product: { name: string } }>
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalSales, setTotalSales] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null)
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page])

  async function loadSales() {
    try {
      setLoading(true)
      const result = await getSales(debouncedSearch || undefined, page, pageSize)
      setSales(result.sales)
      setTotalSales(result.total)
      setTotalPages(result.totalPages)
    } catch {
      console.error('Error loading sales')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelSale(sale: Sale) {
    const result = await cancelSale(sale.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Venta anulada')
      await loadSales()
    }
    setCancelDialogOpen(false)
    setSaleToCancel(null)
  }

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo'
      case 'CARD':
        return 'Tarjeta'
      case 'TRANSFER':
        return 'Transferencia'
      default:
        return method
    }
  }

  if (loading && sales.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
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
        title="Historial de Ventas"
        description="Consulta y gestiona las ventas realizadas"
        actions={
          <Link href="/sales">
            <Button>Nueva Venta</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por factura, cliente..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{sale.invoiceNumber}</span>
                    </TableCell>
                    <TableCell>
                      {sale.client ? (
                        <div>
                          <div className="text-sm">{sale.client.name}</div>
                          {sale.client.phone && (
                            <div className="text-xs text-muted-foreground">{sale.client.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paymentMethodLabel(sale.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      {sale.status === 'COMPLETED' ? (
                        <Badge variant="default" className="bg-green-500">
                          Completada
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Anulada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString('es-CO')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/sales/${sale.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {sale.status === 'COMPLETED' && (
                          <>
                            <Link href={`/sales/${sale.id}/invoice`}>
                              <Button variant="ghost" size="icon-sm">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={() => {
                                setSaleToCancel(sale)
                                setCancelDialogOpen(true)
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sales.length === 0 && (
            <EmptyState
              icon={Receipt}
              title={search ? 'Sin resultados' : 'Sin ventas'}
              description={search ? 'No hay ventas que coincidan' : 'Realiza tu primera venta desde el POS'}
              action={search ? undefined : { label: 'Ir al POS', href: '/sales' }}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalSales}
              entity="ventas"
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Anular venta?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas anular la venta {saleToCancel?.invoiceNumber}? Se devolverá el stock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => saleToCancel && handleCancelSale(saleToCancel)}>
              Anular Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
