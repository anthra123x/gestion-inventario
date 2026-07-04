import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  repair: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  client: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  repairPart: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/modules/auth/auth.actions', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN', email: 'admin@test.com', name: 'Admin' }),
}))

import { createRepair, updateRepairStatus, deleteRepair, getRepairs, getRepairById } from '../repairs.actions'

function createFormData(data: Record<string, string | Blob>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value)
  }
  return fd
}

describe('createRepair', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) => {
      return fn(mockPrisma)
    })
  })

  it('creates a repair with basic data', async () => {
    const mockRepair = { id: 'repair-1', device: 'iPhone 12', problem: 'Pantalla rota' }
    mockPrisma.repair.create.mockResolvedValue(mockRepair)

    const formData = createFormData({
      device: 'iPhone 12',
      problem: 'Pantalla rota',
      laborCost: '50000',
      clientName: 'Juan Pérez',
      clientPhone: '3001234567',
      parts: '[]',
    })

    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' })

    const result = await createRepair(formData)

    expect(result).toHaveProperty('success', 'Reparación creada exitosamente')
    expect(mockPrisma.repair.create).toHaveBeenCalledOnce()
  })

  it('returns error when device is too short', async () => {
    const formData = createFormData({
      device: 'X',
      problem: 'Pantalla rota',
      laborCost: '50000',
      clientName: 'Juan Pérez',
      clientPhone: '3001234567',
      parts: '[]',
    })

    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' })

    const result = await createRepair(formData)

    expect(result).toHaveProperty('error')
  })

  it('handles invalid parts JSON', async () => {
    const formData = createFormData({
      device: 'iPhone 12',
      problem: 'Pantalla rota',
      laborCost: '50000',
      clientName: 'Juan Pérez',
      clientPhone: '3001234567',
      parts: 'invalid-json',
    })

    const result = await createRepair(formData)

    expect(result).toEqual({ error: 'Datos de repuestos inválidos' })
  })
})

describe('updateRepairStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates status to DELIVERED with date', async () => {
    const mockRepair = {
      id: 'repair-1',
      status: 'DELIVERED',
      dateDelivered: new Date(),
    }
    mockPrisma.repair.update.mockResolvedValue(mockRepair)

    const result = await updateRepairStatus('repair-1', 'DELIVERED')

    expect(result).toHaveProperty('success', 'Estado actualizado exitosamente')
    expect(mockPrisma.repair.update).toHaveBeenCalledWith({
      where: { id: 'repair-1' },
      data: { status: 'DELIVERED', dateDelivered: expect.any(Date) },
    })
  })

  it('updates status to READY without date', async () => {
    const mockRepair = { id: 'repair-1', status: 'READY' }
    mockPrisma.repair.update.mockResolvedValue(mockRepair)

    const result = await updateRepairStatus('repair-1', 'READY')

    expect(result).toHaveProperty('success')
    expect(mockPrisma.repair.update).toHaveBeenCalledWith({
      where: { id: 'repair-1' },
      data: { status: 'READY' },
    })
  })

  it('returns error when update fails', async () => {
    mockPrisma.repair.update.mockRejectedValue(new Error('DB error'))

    const result = await updateRepairStatus('repair-1', 'CANCELLED')

    expect(result).toHaveProperty('error', 'Error al actualizar el estado')
  })
})

describe('deleteRepair', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a repair successfully', async () => {
    mockPrisma.repair.delete.mockResolvedValue({ id: 'repair-1' })

    const result = await deleteRepair('repair-1')

    expect(result).toHaveProperty('success', 'Reparación eliminada exitosamente')
    expect(mockPrisma.repair.delete).toHaveBeenCalledWith({ where: { id: 'repair-1' } })
  })

  it('returns error when delete fails', async () => {
    mockPrisma.repair.delete.mockRejectedValue(new Error('DB error'))

    const result = await deleteRepair('repair-1')

    expect(result).toHaveProperty('error', 'Error al eliminar la reparación')
  })
})

describe('getRepairs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated repairs', async () => {
    mockPrisma.repair.findMany.mockResolvedValue([{ id: 'repair-1', device: 'iPhone' }])
    mockPrisma.repair.count.mockResolvedValue(1)

    const result = await getRepairs()

    expect(result).toHaveProperty('repairs')
    expect(result).toHaveProperty('total', 1)
    expect(result).toHaveProperty('page', 1)
    expect(mockPrisma.repair.findMany).toHaveBeenCalledOnce()
  })
})

describe('getRepairById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a repair by id', async () => {
    const mockRepair = { id: 'repair-1', device: 'iPhone 12', client: { name: 'Juan' }, repairParts: [], user: { name: 'Admin' } }
    mockPrisma.repair.findUnique.mockResolvedValue(mockRepair)

    const result = await getRepairById('repair-1')

    expect(result).toEqual(mockRepair)
    expect(mockPrisma.repair.findUnique).toHaveBeenCalledWith({
      where: { id: 'repair-1' },
      include: {
        client: true,
        repairParts: { include: { part: true } },
        user: { select: { name: true } },
      },
    })
  })
})
