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

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight">Tecnicell</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              title={`Atajo: ${item.shortcut}`}
            >
              <item.icon className="mr-3 h-5 w-5 opacity-80 group-hover:opacity-100" />
              <span className="flex-1">{item.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
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
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                pathname === '/admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              title="Atajo: Alt+A"
            >
              <Settings className="mr-3 h-5 w-5 opacity-80 group-hover:opacity-100" />
              <span className="flex-1">Administración</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent/50 text-sidebar-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                A
              </span>
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Alt+Q para búsqueda</span>
        </div>
      </div>
    </div>
  )
}
