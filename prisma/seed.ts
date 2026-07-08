import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Trabajo Técnico', type: 'INCOME' as const, color: 'green', icon: 'wrench' },
  { name: 'Arriendo', type: 'EXPENSE' as const, color: 'red', icon: 'home' },
  { name: 'Comida', type: 'EXPENSE' as const, color: 'orange', icon: 'utensils' },
  { name: 'Transporte', type: 'EXPENSE' as const, color: 'yellow', icon: 'car' },
  { name: 'Servicios', type: 'EXPENSE' as const, color: 'blue', icon: 'zap' },
  { name: 'Suscripciones', type: 'EXPENSE' as const, color: 'purple', icon: 'radio' },
  { name: 'Salud', type: 'EXPENSE' as const, color: 'pink', icon: 'heart-pulse' },
  { name: 'Ahorro', type: 'SAVING_GOAL' as const, color: 'teal', icon: 'piggy-bank' },
  { name: 'Entretenimiento', type: 'EXPENSE' as const, color: 'indigo', icon: 'gamepad-2' },
  { name: 'Otros', type: 'EXPENSE' as const, color: 'gray', icon: 'more-horizontal' },
]

async function main() {
  console.log('Seeding default categories...')

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, deletedAt: null },
    })
    if (!existing) {
      await prisma.category.create({ data: cat })
      console.log(`  Created: ${cat.name} (${cat.type})`)
    } else {
      console.log(`  Skipped (exists): ${cat.name}`)
    }
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })