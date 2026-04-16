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
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">Tecnicell</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
              title={`Atajo: ${item.shortcut}`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.shortcut}
              </span>
            </Link>
          )
        })}

        {userRole === 'ADMIN' && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4 group',
              pathname === '/admin'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            )}
            title="Atajo: Alt+A"
          >
            <Settings className="mr-3 h-5 w-5" />
            <span className="flex-1">Administración</span>
            <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Alt+A
            </span>
          </Link>
        )}
      </nav>

      <div className="border-t border-gray-700 px-3 py-4">
        <div className="flex items-center text-xs text-gray-400">
          <Keyboard className="mr-2 h-4 w-4" />
          <span>Alt+Q para búsqueda</span>
        </div>
      </div>
    </div>
  )
}
