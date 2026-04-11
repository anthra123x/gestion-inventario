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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Ventas', href: '/sales', icon: ShoppingCart },
  { name: 'Reparaciones', href: '/repairs', icon: Wrench },
  { name: 'Reportes', href: '/reports', icon: FileText },
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
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {userRole === 'ADMIN' && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4',
              pathname === '/admin'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            )}
          >
            <Settings className="mr-3 h-5 w-5" />
            Administración
          </Link>
        )}
      </nav>
    </div>
  )
}
