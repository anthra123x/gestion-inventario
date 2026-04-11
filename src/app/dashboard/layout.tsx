import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout/dashboard-layout'
import { UserRole } from '@prisma/client'

// Temporarily using a mock user since getCurrentUser doesn't work in server actions
const mockUser = {
  id: '1',
  email: 'admin@tecnicell.com',
  name: 'Admin',
  role: 'ADMIN' as UserRole,
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutComponent user={mockUser}>
      {children}
    </DashboardLayoutComponent>
  )
}
