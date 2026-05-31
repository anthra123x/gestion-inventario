'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, ImagePlus, Trash2, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import {
  getEcommerceProductById,
  updateEcommerceProduct,
  addEcommerceImage,
  deleteEcommerceImage,
  setPrimaryImage,
} from '@/modules/ecommerce/ecommerce.actions'

type EcommerceDetail = NonNullable<Awaited<ReturnType<typeof getEcommerceProductById>>>

export default function EcommerceProductDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [item, setItem] = useState<EcommerceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [visible, setVisible] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [showStock, setShowStock] = useState(true)
  const [ecommercePrice, setEcommercePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [badgeInput, setBadgeInput] = useState('')
  const [badges, setBadges] = useState<string[]>([])

  useEffect(() => {
    loadItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadItem() {
    try {
      const data = await getEcommerceProductById(id)
      if (!data) {
        toast.error('Producto no encontrado')
        router.push('/ecommerce/products')
        return
      }
      setItem(data)
      setVisible(data.visible)
      setFeatured(data.featured)
      setShowStock(data.showStock)
      setEcommercePrice(data.ecommercePrice?.toString() || '')
      setCompareAtPrice(data.compareAtPrice?.toString() || '')
      setSlug(data.slug || '')
      setShortDescription(data.shortDescription || '')
      setLongDescription(data.longDescription || '')
      setBadges(data.badges || [])
    } catch {
      toast.error('Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('visible', String(visible))
      fd.set('featured', String(featured))
      fd.set('showStock', String(showStock))
      fd.set('ecommercePrice', ecommercePrice)
      fd.set('compareAtPrice', compareAtPrice)
      fd.set('slug', slug)
      fd.set('shortDescription', shortDescription)
      fd.set('longDescription', longDescription)
      fd.set('badges', JSON.stringify(badges))

      const result = await updateEcommerceProduct(id, fd)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success!)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function addBadge() {
    const val = badgeInput.trim()
    if (val && !badges.includes(val)) {
      setBadges([...badges, val])
      setBadgeInput('')
    }
  }

  function removeBadge(b: string) {
    setBadges(badges.filter((x) => x !== b))
  }

  async function handleAddImage() {
    const url = prompt('URL de la imagen:')
    if (!url) return
    const isPrimary = !item?.media?.length
    const result = await addEcommerceImage(id, url, isPrimary)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    loadItem()
  }

  async function handleDeleteImage(mediaId: string) {
    const result = await deleteEcommerceImage(mediaId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    loadItem()
  }

  async function handleSetPrimary(mediaId: string) {
    const result = await setPrimaryImage(mediaId, id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(result.success!)
    loadItem()
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title={item.product.name}
        description={`ID: ${item.product.id.slice(-8)} · ${item.product.category} · Stock: ${item.product.stock}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/ecommerce/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio tienda online</Label>
                  <Input
                    type="number"
                    value={ecommercePrice}
                    onChange={(e) => setEcommercePrice(e.target.value)}
                    placeholder={formatCurrency(item.product.salePrice)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Precio interno: {formatCurrency(item.product.salePrice)}. Si se deja vacío, se usará el precio
                    interno.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Precio de comparación (tachado)</Label>
                  <Input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="Ej: precio original"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slug (URL amigable)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ej: funda-samsung-a54" />
              </div>
              <div className="space-y-2">
                <Label>Descripción corta</Label>
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción para tarjetas de producto"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción larga (comercial)</Label>
                <Textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={5}
                  placeholder="Descripción detallada con HTML o markdown"
                />
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Badges y etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <Badge key={b} variant="secondary" className="gap-1 pr-1">
                    {b}
                    <button onClick={() => removeBadge(b)} className="ml-1 hover:text-destructive">
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  placeholder="Nuevo, Oferta, Más vendido..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBadge())}
                />
                <Button variant="outline" onClick={addBadge}>
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visible en tienda</Label>
                <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Destacado</Label>
                <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showStock">Mostrar stock</Label>
                <Switch id="showStock" checked={showStock} onCheckedChange={setShowStock} />
              </div>
              {item.publishedAt && (
                <p className="text-xs text-muted-foreground">
                  Publicado: {new Date(item.publishedAt).toLocaleDateString('es-CO')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Imágenes</CardTitle>
                <Button variant="outline" size="xs" onClick={handleAddImage}>
                  <ImagePlus className="h-3.5 w-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {item.media?.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                    <ImagePlus className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    Sin imágenes
                  </div>
                )}
                {item.media?.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
                      <img src={m.url} alt={m.alt || ''} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{m.url}</p>
                      <p className="text-[10px] text-muted-foreground">Orden: {m.sortOrder}</p>
                    </div>
                    <div className="flex gap-1">
                      {!m.isPrimary ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleSetPrimary(m.id)}
                          title="Marcar como principal"
                        >
                          <StarOff className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive"
                        onClick={() => handleDeleteImage(m.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
