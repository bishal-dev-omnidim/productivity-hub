import { prisma } from '@/lib/db'
import { DEMO_USER_EMAIL } from '@/auth'

export async function getUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  })
  if (!user) throw new Error('Demo user not found. Visit the app homepage first.')
  return user.id
}
