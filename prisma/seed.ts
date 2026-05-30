import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SEED_CATEGORIES = [
  { name: 'Deep Work', color: '#6366f1', order: 0 },
  { name: 'Meetings', color: '#f59e0b', order: 1 },
  { name: 'Admin', color: '#10b981', order: 2 },
  { name: 'Personal', color: '#ec4899', order: 3 },
  { name: 'Learning', color: '#3b82f6', order: 4 },
]

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      categories: { create: SEED_CATEGORIES },
    },
  })
  console.log('Seeded demo user:', user.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
