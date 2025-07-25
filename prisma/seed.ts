import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Check if users already exist
  const existingUsers = await prisma.user.findMany()
  if (existingUsers.length > 0) {
    console.log('✅ Database already seeded with', existingUsers.length, 'users')
    return
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@primeedge.com',
      password: adminPassword,
      role: 'ADMIN',
      balance: 10000,
      accountType: 'BUSINESS',
    },
  })

  // Create demo users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: userPassword,
      role: 'USER',
      balance: 2500,
      accountType: 'CHECKING',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      password: userPassword,
      role: 'USER',
      balance: 1750,
      accountType: 'SAVINGS',
    },
  })

  // Create some sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: user1.id,
        type: 'CREDIT',
        amount: 500,
        description: 'Initial deposit',
        reference: 'INIT-001',
      },
      {
        userId: user1.id,
        type: 'DEBIT',
        amount: 100,
        description: 'ATM withdrawal',
        reference: 'ATM-001',
      },
      {
        userId: user2.id,
        type: 'CREDIT',
        amount: 1000,
        description: 'Salary deposit',
        reference: 'SAL-001',
      },
      {
        userId: user2.id,
        type: 'DEBIT',
        amount: 250,
        description: 'Online purchase',
        reference: 'PUR-001',
      },
    ],
  })

  // Create admin log entries
  await prisma.adminLog.createMany({
    data: [
      {
        adminId: admin.id,
        action: 'USER_CREATED',
        targetUserId: user1.id,
        description: 'Created user account for John Doe',
      },
      {
        adminId: admin.id,
        action: 'USER_CREATED',
        targetUserId: user2.id,
        description: 'Created user account for Sarah Wilson',
      },
      {
        adminId: admin.id,
        action: 'BALANCE_UPDATED',
        targetUserId: user1.id,
        amount: 2500,
        description: 'Set initial balance',
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user:', admin.email, '(password: admin123)')
  console.log('👤 Demo user 1:', user1.email, '(password: user123)')
  console.log('👤 Demo user 2:', user2.email, '(password: user123)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })