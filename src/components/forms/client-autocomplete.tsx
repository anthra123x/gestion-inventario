'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { searchClients } from '@/modules/clients/clients.actions'

interface ClientResult {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
}

interface ClientAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (client: ClientResult) => void
  placeholder?: string
}

export function ClientAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nombre del cliente',
}: ClientAutocompleteProps) {
  const [results, setResults] = useState<ClientResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await searchClients(query)
      setResults(data)
      setIsOpen(data.length > 0 && isFocused)
      setActiveIndex(-1)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [isFocused])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, doSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          handleSelect(results[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  function handleSelect(client: ClientResult) {
    onSelect(client)
    onChange(client.name)
    setIsOpen(false)
    setResults([])
    setActiveIndex(-1)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            if (results.length > 0) setIsOpen(true)
          }}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200)
          }}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          {results.map((client, index) => (
            <button
              key={client.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(client)
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b last:border-0 ${
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
            >
              <div className="font-medium">{client.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{client.phone}</span>
                {client.email && (
                  <>
                    <span>·</span>
                    <span>{client.email}</span>
                  </>
                )}
                {client.address && (
                  <>
                    <span>·</span>
                    <span className="truncate max-w-40">{client.address}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && value.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-muted-foreground">
            No se encontraron clientes con &ldquo;{value}&rdquo;
          </div>
        </div>
      )}
    </div>
  )
}
