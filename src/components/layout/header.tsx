'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { Search, LogOut, User, Menu, Package, Users, Receipt, PackageSearch, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'
import { globalSearch } from '@/modules/search/search.actions'
import { formatCurrency } from '@/lib/format'

interface HeaderProps {
  user: {
    name: string
    email: string
  }
  onMenuClick?: () => void
}

interface SearchResults {
  products: Array<{
    id: string
    name: string
    barcode: string | null
    salePrice: number
    stock: number
    category: { name: string } | null
  }>
  clients: Array<{ id: string; name: string; phone: string | null }>
  sales: Array<{ id: string; invoiceNumber: string; total: number }>
}

const EMPTY_RESULTS: SearchResults = { products: [], clients: [], sales: [] }

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()

  function handleLogout() {
    router.push('/auth/logout')
  }

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hasResults =
    results.products.length > 0 || results.clients.length > 0 || results.sales.length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  function handleSearchChange(value: string) {
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (value.trim().length < 2) {
      setResults(EMPTY_RESULTS)
      setOpen(false)
      setSearching(false)
      return
    }

    setOpen(true)
    setSearching(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await globalSearch(value)
        setResults(data)
      } catch {
        setResults(EMPTY_RESULTS)
      } finally {
        setSearching(false)
      }
    }, 250)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'Enter') {
      const first = results.products[0]
      if (first) {
        e.preventDefault()
        router.push(`/inventory/${first.id}`)
        setOpen(false)
      } else if (hasResults) {
        e.preventDefault()
        router.push('/sales')
        setOpen(false)
      } else if (query.trim().length >= 2) {
        e.preventDefault()
        router.push('/inventory')
        setOpen(false)
      }
    }
  }

  function goToInventory() {
    setOpen(false)
    setQuery('')
    router.push('/inventory')
  }

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    router.push(path)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-30 shadow-sm shadow-primary/[0.03]">
      <div className="flex items-center gap-3 lg:gap-4">
        <Link href="/" className="shrink-0 leading-none" aria-label="Ir al inicio">
          <Image
            src="/logo cilmax.png"
            alt="Cilmax"
            width={200}
            height={40}
            priority
            className="h-9 w-auto object-contain lg:h-10"
          />
        </Link>
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden -ml-1.5">
          <Menu className="h-5 w-5" />
        </Button>

        <div ref={searchBoxRef} className="relative flex-1 max-w-sm lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            id="global-search"
            type="search"
            placeholder="Buscar producto, cliente o factura... (Alt+Q)"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results && query.trim().length >= 2) setOpen(true)
            }}
            onBlur={() => {
              if (debounceTimer.current) clearTimeout(debounceTimer.current)
            }}
            className="w-full pl-10 bg-muted/40 border-border/60 focus-visible:bg-background transition-colors duration-200"
          />

          {open && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </div>
              ) : !hasResults ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Sin resultados para &quot;{query.trim()}&quot;
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto py-1">
                  {results.products.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Productos
                      </div>
                      {results.products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => navigate(`/inventory/${p.id}`)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        >
                          <span className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {p.category?.name}
                              {p.barcode ? ` · ${p.barcode}` : ''}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold">{formatCurrency(p.salePrice)}</span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                p.stock <= 0
                                  ? 'bg-destructive/10 text-destructive'
                                  : p.stock <= 5
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {p.stock} u
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.clients.length > 0 && (
                    <div className="py-1 border-t border-border/60">
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Clientes
                      </div>
                      {results.clients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => navigate('/clients')}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        >
                          <span className="font-medium truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.sales.length > 0 && (
                    <div className="py-1 border-t border-border/60">
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> Facturas
                      </div>
                      {results.sales.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => navigate(`/sales/${s.id}`)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        >
                          <span className="font-medium truncate">{s.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatCurrency(s.total)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={goToInventory}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-t border-border bg-muted/40 hover:bg-accent transition-colors"
              >
                <PackageSearch className="h-4 w-4" />
                Ir al inventario completo
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 lg:gap-3 cursor-pointer rounded-lg p-1.5 hover:bg-muted/70 transition-all duration-200 active:scale-[0.98]">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground/70">Administrador</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}