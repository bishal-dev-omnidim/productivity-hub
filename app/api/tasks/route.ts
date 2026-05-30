import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, handle } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET /api/tasks?categoryId=...&q=...  — recent tasks for autocomplete
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const { searchParams } = req.nextUrl
    const categoryId = searchParams.get('categoryId') ?? undefined
    const q = searchParams.get('q') ?? undefined

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(categoryId ? { categoryId } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { lastUsed: 'desc' },
      take: 20,
      select: { id: true, name: true, categoryId: true, lastUsed: true },
    })

    return ok(tasks)
  })
}
