'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wrench,
  FileText,
  Settings,
  Keyboard,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'Alt+D' },
  { name: 'Inventario', href: '/inventory', icon: Package, shortcut: 'Alt+I' },
  { name: 'Ventas', href: '/sales', icon: ShoppingCart, shortcut: 'Alt+V' },
  { name: 'Reparaciones', href: '/repairs', icon: Wrench, shortcut: 'Alt+R' },
  { name: 'Reportes', href: '/reports', icon: FileText, shortcut: 'Alt+P' },
]

interface SidebarProps {
  userRole: 'ADMIN' | 'EMPLOYEE'
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shrink-0">
          <LayoutDashboard className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">Gesti\u00f3n</h1>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90',
              )}
              title={`Atajo: ${item.shortcut}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-white/70" />
              )}
              <item.icon className={cn(
                'mr-3 h-4 w-4 shrink-0 transition-transform duration-150',
                active ? 'opacity-100' : 'opacity-70 group-hover:opacity-90',
              )} />
              <span className="flex-1">{item.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/40 group-hover:opacity-100 transition-opacity font-mono opacity-0">
                {item.shortcut.split('+')[1]}
              </span>
            </Link>
          )
        })}

        {userRole === 'ADMIN' && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <Link
              href="/admin"
              className={cn(
                'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                pathname === '/admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90',
              )}
              title="Atajo: Alt+A"
            >
              {pathname === '/admin' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-white/70" />
              )}
              <Settings className={cn(
                'mr-3 h-4 w-4 shrink-0',
                pathname === '/admin' ? 'opacity-100' : 'opacity-70',
              )} />
              <span className="flex-1">Administración</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                A
              </span>
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5 text-xs text-sidebar-foreground/40">
          <Keyboard className="h-3.5 w-3.5 shrink-0" />
          <span>Alt+Q para búsqueda</span>
        </div>
      </div>
    </div>
  )
}
