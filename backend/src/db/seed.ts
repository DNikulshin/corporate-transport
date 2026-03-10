import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // --- Создаем 5 машин ---
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plateNumber: 'А001АА77' },
      update: {},
      create: { name: 'Газель 001', plateNumber: 'А001АА77' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'В002ВВ77' },
      update: {},
      create: { name: 'Ford Transit 002', plateNumber: 'В002ВВ77' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'С003СС77' },
      update: {},
      create: { name: 'Sprinter 003', plateNumber: 'С003СС77' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'Е004ЕЕ77' },
      update: {},
      create: { name: 'Lada Largus 004', plateNumber: 'Е004ЕЕ77' },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: 'К005КК77' },
      update: {},
      create: { name: 'VW Transporter 005', plateNumber: 'К005КК77' },
    }),
  ])

  // --- Создаем 5 водителей и привязываем к машинам ---
  await Promise.all([
    prisma.user.upsert({
      where: { username: 'driver1' },
      update: { vehicleId: vehicles[0].id },
      create: {
        username: 'driver1',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Иван Петров',
        role: 'DRIVER',
        vehicleId: vehicles[0].id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'driver2' },
      update: { vehicleId: vehicles[1].id },
      create: {
        username: 'driver2',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Алексей Сидоров',
        role: 'DRIVER',
        vehicleId: vehicles[1].id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'driver3' },
      update: { vehicleId: vehicles[2].id },
      create: {
        username: 'driver3',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Сергей Воробьев',
        role: 'DRIVER',
        vehicleId: vehicles[2].id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'driver4' },
      update: { vehicleId: vehicles[3].id },
      create: {
        username: 'driver4',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Дмитрий Кузнецов',
        role: 'DRIVER',
        vehicleId: vehicles[3].id,
      },
    }),
    prisma.user.upsert({
      where: { username: 'driver5' },
      update: { vehicleId: vehicles[4].id },
      create: {
        username: 'driver5',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Михаил Попов',
        role: 'DRIVER',
        vehicleId: vehicles[4].id,
      },
    }),
  ])

  // --- Создаем 3 сотрудников (пассажиров) ---
  await Promise.all([
    prisma.user.upsert({
      where: { username: 'employee1' },
      update: {},
      create: {
        username: 'employee1',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Мария Иванова',
        role: 'EMPLOYEE',
      },
    }),
    prisma.user.upsert({
      where: { username: 'employee2' },
      update: {},
      create: {
        username: 'employee2',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Елена Смирнова',
        role: 'EMPLOYEE',
      },
    }),
    prisma.user.upsert({
      where: { username: 'employee3' },
      update: {},
      create: {
        username: 'employee3',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Ольга Васильева',
        role: 'EMPLOYEE',
      },
    }),
  ])

  // --- Создаем 1 администратора ---
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'Администратор',
      role: 'ADMIN',
    },
  })

  console.log('✅ Seed complete!')
  console.log('👤 Тестовые аккаунты:')
  console.log('   - 1 админ: admin / admin123')
  console.log('   - 5 водителей: driver1..5 / password123')
  console.log('   - 3 сотрудника: employee1..3 / password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
