import 'server-only'
import { prisma } from '@/lib/db'
import { DEMO_USER_EMAIL } from '@/auth'

const DEFAULT_CATEGORIES = [
  { name: 'Deep Work', color: '#6366f1', order: 0 },
  { name: 'Meetings', color: '#f59e0b', order: 1 },
  { name: 'Admin', color: '#10b981', order: 2 },
  { name: 'Personal', color: '#ec4899', order: 3 },
  { name: 'Learning', color: '#3b82f6', order: 4 },
]

/**
 * Returns the current user's id. Auth is currently a dev bypass (demo user);
 * swap the lookup here when real auth is wired in.
 */
export async function getUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  })
  if (!user) throw new Error('Demo user not found. Visit the app homepage first.')
  return user.id
}

/** Creates the demo user with default categories if it doesn't exist yet. */
export async function ensureDemoUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      name: 'Demo User',
      categories: { create: DEFAULT_CATEGORIES },
    },
  })
  return user.id
}
