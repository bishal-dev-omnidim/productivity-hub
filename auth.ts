import { prisma } from '@/lib/db'

export const DEMO_USER_EMAIL = 'demo@example.com'

// Dev bypass: returns a hardcoded session for the seeded demo user.
// Replace this with real NextAuth when adding OAuth.
export async function auth() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  })
  if (!user) return null
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  }
}

// Stubs so imports don't break
export async function signIn() {}
export async function signOut() {}
export const handlers = { GET: () => new Response('ok'), POST: () => new Response('ok') }
