'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name: string
    email: string
    role: 'ADMIN' | 'EMPLOYEE'
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
