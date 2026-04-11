import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout/dashboard-layout'
import { requireAdmin } from '@/modules/auth/auth.actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return (
    <DashboardLayoutComponent user={user}>
      {children}
    </DashboardLayoutComponent>
  )
}
