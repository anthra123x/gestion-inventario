import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout/dashboard-layout'
import { requireAuth } from '@/modules/auth/auth.actions'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()

  return <DashboardLayoutComponent user={user}>{children}</DashboardLayoutComponent>
}
