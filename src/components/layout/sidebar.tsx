'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Settings,
  Keyboard,
  Users,
  Package,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reparaciones', href: '/repairs', icon: Wrench },
  { name: 'Repuestos', href: '/inventory', icon: Package },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Reportes', href: '/reports', icon: FileText },
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0 shadow-sm shadow-sidebar-primary/30">
          <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-tight leading-tight">
            Gesti\u00f3n<span className="font-light text-sidebar-foreground/60"> Reparaciones</span>
          </p>
          <p className="text-[10px] text-sidebar-foreground/35 tracking-wider uppercase">ERP Taller</p>
        </div>
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
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90',
              )}
            >
              <item.icon className={cn(
                'mr-3 h-4 w-4 shrink-0 transition-all duration-150',
                active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
              )} />
              <span className="flex-1">{item.name}</span>
              {active && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
              )}
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
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90',
              )}
            >
              <Settings className={cn(
                'mr-3 h-4 w-4 shrink-0 transition-all duration-150',
                pathname === '/admin' ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
              )} />
              <span className="flex-1">Administraci\u00f3n</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/30">
          <Keyboard className="h-3 w-3 shrink-0" />
          <span>Alt+Q buscar &middot; Alt+D dashboard</span>
        </div>
      </div>
    </div>
  )
}
