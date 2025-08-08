import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.log('⚠️  Continuing without database - UI will be available but functionality limited')
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
}

// Export types for use in other files
export type { 
  User, 
  Transaction, 
  AdminLog, 
  Role, 
  AccountType, 
  TransactionType, 
  TransactionStatus,
  KycRequest,
  KycRequestStatus,
  KycStatus
} from '@prisma/client'