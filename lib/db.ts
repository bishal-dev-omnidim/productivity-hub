import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient() {
  // Strip sslmode from the URL — we configure TLS explicitly on the Pool below.
  // Supabase uses a self-signed cert chain, so rejectUnauthorized must be false.
  const connectionString = (process.env.DATABASE_URL ?? '').replace(/[?&]sslmode=[^&]*/g, '')

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
