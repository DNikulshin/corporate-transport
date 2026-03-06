import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создать тестовые машины
  const vehicle1 = await prisma.vehicle.upsert({
    where: { plateNumber: 'А001АА77' },
    update: {},
    create: { name: 'Газель 001', plateNumber: 'А001АА77' },
  })

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plateNumber: 'В002ВВ77' },
    update: {},
    create: { name: 'Ford Transit 002', plateNumber: 'В002ВВ77' },
  })

  const vehicle3 = await prisma.vehicle.upsert({
    where: { plateNumber: 'С003СС77' },
    update: {},
    create: { name: 'Sprinter 003', plateNumber: 'С003СС77' },
  })

  // Водитель 1
  await prisma.user.upsert({
    where: { username: 'driver1' },
    update: {},
    create: {
      username: 'driver1',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Иван Петров',
      role: 'DRIVER',
      vehicleId: vehicle1.id,
    },
  })

  // Водитель 2
  await prisma.user.upsert({
    where: { username: 'driver2' },
    update: {},
    create: {
      username: 'driver2',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Алексей Сидоров',
      role: 'DRIVER',
      vehicleId: vehicle2.id,
    },
  })

  // Сотрудник
  await prisma.user.upsert({
    where: { username: 'employee1' },
    update: {},
    create: {
      username: 'employee1',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Мария Иванова',
      role: 'EMPLOYEE',
    },
  })

  console.log('✅ Seed complete!')
  console.log('👤 Тестовые аккаунты:')
  console.log('   driver1 / password123 (Водитель, Газель 001)')
  console.log('   driver2 / password123 (Водитель, Ford Transit 002)')
  console.log('   employee1 / password123 (Сотрудник)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
