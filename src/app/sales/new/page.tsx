'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { ClientAutocomplete } from '@/components/forms/client-autocomplete'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { createSale } from '@/modules/sales/sales.actions'

interface CartItem {
  productId: string
  name: string
  unitPrice: number
  stock: number
  quantity: number
}

interface ProductOption {
  id: string
  name: string
  salePrice: number
  stock: number
  category: { name: string } | null
}

export default function NewSalePage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH')
  const [clientName, setClientName] = useState('')
  const [client, setClient] = useState<{ id: string; name: string; phone: string | null; email: string | null } | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const result = await getProducts(undefined, 1, 100)
      setProducts(result.products.map((p) => ({ ...p, salePrice: Number(p.salePrice) })))
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const inCart = new Set(cart.map((i) => i.productId))
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => !inCart.has(p.id))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.category?.name.toLowerCase().includes(q) ?? false),
      )
  }, [products, search, cart])

  function addToCart(product: ProductOption) {
    if (product.stock <= 0) {
      toast.error('Sin stock', { description: `${product.name} no tiene stock disponible` })
      return
    }
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        unitPrice: product.salePrice,
        stock: product.stock,
        quantity: 1,
      },
    ])
    setSearch('')
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 1) return item
        if (newQty > item.stock) {
          toast.error('Stock insuficiente', { description: `Solo hay ${item.stock} unidades` })
          return item
        }
        return { ...item, quantity: newQty }
      }),
    )
  }

  function updateUnitPrice(productId: string, value: number) {
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, unitPrice: value } : item)),
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart])
  const total = subtotal - discount

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto a la venta')
      return
    }
    if (discount < 0) {
      toast.error('El descuento no puede ser negativo')
      return
    }

    setSaving(true)
    try {
      const result = await createSale({
        clientId: client?.id || null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discount,
        paymentMethod,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Venta registrada exitosamente')
      router.push(`/sales/${result.sale?.id}`)
      router.refresh()
    } catch {
      toast.error('Error al procesar la venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Nueva Venta"
        description="Registra una venta y genera su factura"
        actions={
          <Link href="/sales">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selección de productos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto del inventario..."
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="p-3 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-sm truncate">{product.name}</div>
                    {product.category && (
                      <div className="text-xs text-muted-foreground mt-1">{product.category.name}</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm">{formatCurrency(product.salePrice)}</span>
                      <Badge variant={product.stock <= 5 ? 'destructive' : 'secondary'} className="text-xs">
                        {product.stock}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 && !loading && (
                <EmptyState
                  icon={ShoppingCart}
                  title={search ? 'Sin productos' : 'Inventario vacío'}
                  description={
                    search
                      ? 'No hay productos que coincidan con la búsqueda'
                      : 'Todos los productos ya están en la venta o no hay inventario'
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalle de la venta */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Cliente (opcional)</label>
              {client ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {client.phone || 'Sin teléfono'}
                        {client.email ? ` · ${client.email}` : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive shrink-0"
                      onClick={() => {
                        setClient(null)
                        setClientName('')
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <ClientAutocomplete
                  value={clientName}
                  onChange={setClientName}
                  onSelect={(c) =>
                    setClient({ id: c.id, name: c.name, phone: c.phone, email: c.email })
                  }
                  placeholder="Buscar cliente por nombre..."
                />
              )}
            </CardContent>
          </Card>

          {/* Productos de la venta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Productos de la venta
                {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Agrega productos desde la lista de la izquierda
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {item.stock} · {formatCurrency(item.unitPrice)} c/u
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateUnitPrice(item.productId, Number(e.target.value) || 0)
                              }
                              className="w-28 ml-auto text-right"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.productId, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.productId, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descuento + pago + total */}
          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Descuento (opcional)</label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Método de pago</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as 'CASH' | 'CARD' | 'TRANSFER')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">
                        <span className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Efectivo
                        </span>
                      </SelectItem>
                      <SelectItem value="CARD">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Tarjeta
                        </span>
                      </SelectItem>
                      <SelectItem value="TRANSFER">
                        <span className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Transferencia
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Descuento</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={saving || cart.length === 0}
              >
                {saving ? 'Procesando...' : 'Registrar Venta y Facturar'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
