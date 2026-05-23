'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSaleSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ClientAutocomplete } from '@/components/forms/client-autocomplete'
import { Plus, Trash2, Search, Loader2, User, Phone, Mail, MapPin, AlertTriangle, CheckCircle, XCircle, TrendingUp, Percent, ShoppingCart } from 'lucide-react'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { Product, PaymentMethod } from '@prisma/client'
import { formatCurrency } from '@/lib/format'
import { calcSubtotal, calcDiscountAmount, calcTotal, calcCost, calcProfit, calcMargin, getProfitStatus, getItemProfit, getItemMargin } from '@/lib/finance'
import { validateSalePriceAgainstCost } from '@/lib/validations-data'

interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
  product?: Product
}

interface SaleFormProps {
  onSubmit: (data: FormData) => Promise<{ error?: string; success?: string }>
  isLoading?: boolean
  redirectTo?: string
}

export function SaleForm({ onSubmit, isLoading = false, redirectTo }: SaleFormProps) {
  const router = useRouter()
  const [items, setItems] = useState<SaleItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [lowMarginWarnings, setLowMarginWarnings] = useState<string[]>([])
  const [clientId, setClientId] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(CreateSaleSchema),
    defaultValues: {
      paymentMethod: 'CASH' as PaymentMethod,
      notes: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
    }
  })

  const paymentMethod = watch('paymentMethod')
  const notes = watch('notes')
  const clientName = watch('clientName')
  const clientPhone = watch('clientPhone')
  const clientEmail = watch('clientEmail')
  const clientAddress = watch('clientAddress')

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoadingData(true)
    try {
      const productsData = await getProducts(undefined, undefined, 1, 1000)
      setProducts(productsData.products)
    } catch (error) {
      toast.error('Error al cargar datos', {
        description: 'No se pudieron cargar los productos. Por favor intenta nuevamente.',
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    const warnings: string[] = []
    for (const item of items) {
      const cost = item.product?.purchasePrice || 0
      if (cost > 0) {
        const validation = validateSalePriceAgainstCost(item.unitPrice, cost)
        if (validation.severity === 'warning' && validation.message) {
          warnings.push(`${item.product?.name}: ${validation.message}`)
        }
      }
    }
    setLowMarginWarnings(warnings)
  }, [items])

  const financials = useMemo(() => {
    const itemsWithCost = items.map(item => ({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unitCost: item.product?.purchasePrice || 0,
    }))
    const subtotal = calcSubtotal(itemsWithCost)
    const discountAmt = calcDiscountAmount(subtotal, discountPercent)
    const total = calcTotal(subtotal, discountPercent)
    const cost = calcCost(itemsWithCost.map(i => ({ unitCost: i.unitCost, quantity: i.quantity })))
    const profit = calcProfit(subtotal, cost, discountPercent)
    const margin = calcMargin(subtotal, cost, discountPercent)
    const status = getProfitStatus(margin, profit)
    return { subtotal, discountAmt, total, cost, profit, margin, status }
  }, [items, discountPercent])

  function addToCart() {
    if (!selectedProduct) return

    if (quantity > selectedProduct.stock) {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${selectedProduct.stock} unidades disponibles.`,
      })
      return
    }

    const existingItemIndex = items.findIndex(item => item.productId === selectedProduct.id)

    if (existingItemIndex >= 0) {
      const newQuantity = items[existingItemIndex].quantity + quantity
      if (newQuantity > selectedProduct.stock) {
        toast.error('Stock insuficiente', {
          description: `El total (${newQuantity}) excede el stock disponible (${selectedProduct.stock}).`,
        })
        return
      }
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity = newQuantity
      setItems(updatedItems)
      toast.success('Cantidad actualizada', {
        description: `${selectedProduct.name} actualizado a ${newQuantity} unidades.`,
      })
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.salePrice,
        product: selectedProduct,
      }])
      toast.success('Producto agregado', {
        description: `${selectedProduct.name} agregado al carrito.`,
      })
    }

    setSelectedProduct(null)
    setQuantity(1)
    setProductSearch('')
  }

  function removeFromCart(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateQuantity(index: number, newQuantity: number) {
    if (newQuantity < 1) return
    const item = items[index]
    const maxStock = item.product?.stock || 0
    if (newQuantity > maxStock) {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${maxStock} unidades disponibles.`,
      })
      return
    }
    const updatedItems = [...items]
    updatedItems[index].quantity = newQuantity
    setItems(updatedItems)
  }

  function updateUnitPrice(index: number, newPrice: number) {
    if (newPrice < 0) return
    const updatedItems = [...items]
    updatedItems[index].unitPrice = newPrice
    setItems(updatedItems)
  }

  function handleClientSelect(client: { id: string; name: string; phone: string | null; email: string | null; address: string | null }) {
    setClientId(client.id)
    setValue('clientName', client.name)
    setValue('clientPhone', client.phone || '')
    setValue('clientEmail', client.email || '')
    setValue('clientAddress', client.address || '')
  }

  function applySuggestedPrice(index: number) {
    const item = items[index]
    if (item.product) {
      updateUnitPrice(index, item.product.salePrice)
    }
  }

  async function handleFormSubmit() {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('clientId', clientId || '')
      formData.append('clientName', clientName || '')
      formData.append('clientPhone', clientPhone || '')
      formData.append('clientEmail', clientEmail || '')
      formData.append('clientAddress', clientAddress || '')
      formData.append('paymentMethod', paymentMethod || 'CASH')
      formData.append('notes', notes || '')
      formData.append('items', JSON.stringify(items))
      formData.append('discountPercent', String(discountPercent))

      const result = await onSubmit(formData)

      if (result?.error) {
        toast.error('Error al registrar venta', {
          description: result.error,
        })
      } else {
        toast.success('Factura generada exitosamente', {
          description: 'La venta ha sido guardada en el sistema.',
        })
        setItems([])
        setSelectedProduct(null)
        setQuantity(1)
        setProductSearch('')
        setDiscountPercent(0)
        setValue('paymentMethod', 'CASH')
        setValue('notes', '')
        setValue('clientName', '')
        setValue('clientPhone', '')
        setValue('clientEmail', '')
        setValue('clientAddress', '')
        if (redirectTo) {
          router.push(redirectTo)
        }
      }
    } catch (err: any) {
      toast.error('Error al registrar venta', {
        description: err?.message || 'Error desconocido',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const hasLoss = financials.status.status === 'loss'
  const hasLowMargin = financials.status.status === 'warning' && financials.margin < 15 && financials.margin >= 0

  return (
    <div className="space-y-6">
      {/* Client Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nombre *</Label>
              <ClientAutocomplete
                name="clientName"
                value={clientName ?? ''}
                onChange={(value) => setValue('clientName', value)}
                onSelect={handleClientSelect}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="clientPhone"
                  {...register('clientPhone')}
                  placeholder="Teléfono (opcional)"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="clientEmail"
                  {...register('clientEmail')}
                  placeholder="Email (opcional)"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="clientAddress"
                  {...register('clientAddress')}
                  placeholder="Dirección (opcional)"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main POS Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product Catalog - 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Catálogo de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick product list */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {filteredProducts.filter(p => p.stock > 0).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(product.salePrice)}</span>
                      <Badge variant={product.stock > product.minStock ? 'default' : 'destructive'} className="text-xs">
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </button>
                ))}
                {filteredProducts.filter(p => p.stock > 0).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No se encontraron productos con stock disponible
                  </div>
                )}
              </div>
            </div>

            {/* Product selection footer */}
            {selectedProduct && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{selectedProduct.name}</p>
                    <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                      <p>Precio sugerido: {formatCurrency(selectedProduct.salePrice)}</p>
                      <p>Costo: {formatCurrency(selectedProduct.purchasePrice)}</p>
                      <p>Stock: {selectedProduct.stock} unidades</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="quantity" className="text-sm">Cant:</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={selectedProduct.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedProduct.stock))}
                        className="w-20"
                      />
                    </div>
                    <Button type="button" onClick={addToCart} size="default">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart / Invoice - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cart Items */}
          {items.length > 0 ? (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Factura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {items.map((item, index) => {
                    const purchasePrice = item.product?.purchasePrice || 0
                    const itemMargin = getItemMargin(item.unitPrice, purchasePrice)
                    const itemProfit = getItemProfit(item.unitPrice, purchasePrice, item.quantity)
                    const priceValidation = purchasePrice > 0 ? validateSalePriceAgainstCost(item.unitPrice, purchasePrice) : null
                    const isLoss = itemProfit < 0
                    const isLowMargin = itemMargin >= 0 && itemMargin < 15

                    return (
                      <div key={index} className={`p-3 rounded-lg border ${
                        isLoss ? 'border-red-300 bg-red-50' : isLowMargin ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product?.name}</p>
                            {priceValidation && priceValidation.message && (
                              <p className={`text-xs mt-0.5 ${isLoss ? 'text-red-600' : 'text-amber-600'}`}>
                                {priceValidation.message}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(index)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-gray-500">Precio</Label>
                            <div className="flex items-center gap-1 mt-1">
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={item.unitPrice}
                                onChange={(e) => updateUnitPrice(index, parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => applySuggestedPrice(index)}
                                className="h-8 w-8 p-0 text-xs text-blue-600 hover:text-blue-700"
                                title="Restaurar precio sugerido"
                              >
                                ↺
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Cantidad</Label>
                            <Input
                              type="number"
                              min={1}
                              max={item.product?.stock || 0}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="h-8 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Total</Label>
                            <p className="text-sm font-semibold mt-2">{formatCurrency(item.unitPrice * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t my-2" />

                {/* Discount */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Percent className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="discount" className="text-sm">Descuento</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      id="discount"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(financials.subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento ({discountPercent}%)</span>
                      <span>-{formatCurrency(financials.discountAmt)}</span>
                    </div>
                  )}
                  <div className="border-t my-1" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(financials.total)}</span>
                  </div>
                  <div className="border-t my-1" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Costo invertido</span>
                    <span className="font-medium text-orange-600">{formatCurrency(financials.cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Utilidad</span>
                    <span className={`font-semibold ${financials.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(financials.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Margen</span>
                    <span className={`font-semibold ${
                      financials.margin >= 15 ? 'text-emerald-600' : financials.margin >= 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {financials.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Status Alert */}
                {hasLoss && (
                  <div className="py-2 px-3 rounded-md border border-red-300 bg-red-50 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">
                      Esta venta genera pérdida. Ajusta los precios o el descuento.
                    </p>
                  </div>
                )}
                {hasLowMargin && !hasLoss && (
                  <div className="py-2 px-3 rounded-md border border-amber-300 bg-amber-50 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-700">
                      Margen bajo ({financials.margin.toFixed(1)}%). Verifica antes de continuar.
                    </p>
                  </div>
                )}
                {!hasLoss && !hasLowMargin && items.length > 0 && financials.profit > 0 && (
                  <div className="py-2 px-3 rounded-md border border-green-300 bg-green-50 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <p className="text-sm text-green-700">
                      Margen saludable ({financials.margin.toFixed(1)}%)
                    </p>
                  </div>
                )}

                {/* Low margin warnings per item */}
                {lowMarginWarnings.length > 0 && (
                  <div className="space-y-1">
                    {lowMarginWarnings.slice(0, 3).map((warning, i) => (
                      <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {warning}
                      </p>
                    ))}
                    {lowMarginWarnings.length > 3 && (
                      <p className="text-xs text-amber-600">+{lowMarginWarnings.length - 3} advertencias más</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Carrito vacío</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona productos del catálogo para comenzar
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment & Submit */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CARD">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Notas adicionales sobre la venta..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  disabled={isSubmitting || isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={items.length === 0 || isSubmitting || isLoading || hasLoss}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Generar Factura'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
