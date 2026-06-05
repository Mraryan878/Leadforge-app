import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
})

async function main() {
  console.log('🌱 Seeding database...')

  const stages = [
    { name: 'New', position: 0 },
    { name: 'Contacted', position: 1 },
    { name: 'Interested', position: 2 },
    { name: 'Meeting Scheduled', position: 3 },
    { name: 'Proposal Sent', position: 4 },
    { name: 'Won', position: 5 },
    { name: 'Lost', position: 6 },
  ]

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage,
    })
  }

  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@leadforge.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@leadforge.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const salesHashedPassword = await bcrypt.hash('sales123', 10)
  await prisma.user.upsert({
    where: { email: 'sales@leadforge.com' },
    update: {},
    create: {
      name: 'Sales User',
      email: 'sales@leadforge.com',
      password: salesHashedPassword,
      role: 'SALES_USER',
    },
  })

  console.log('✅ Seeding complete!')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@leadforge.com / admin123')
  console.log('   Sales: sales@leadforge.com / sales123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })