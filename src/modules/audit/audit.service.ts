import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/modules/auth/auth.actions'

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CONFIRM'
  | 'CANCEL'
  | 'LOGIN'
  | 'EXPORT'
  | 'CLEANUP'

type AuditEntity =
  | 'sale'
  | 'product'
  | 'repair'
  | 'client'
  | 'user'
  | 'setting'
  | 'inventory'

export async function logAudit(
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  details?: string,
) {
  try {
    const user = await getCurrentUser()
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
      },
    })
  } catch {
    // Audit failures should never break the main operation
  }
}
