import 'server-only'
import { prisma } from '@/lib/db'

/** Pure data-access layer for tasks (autocomplete source). */
export const tasksService = {
  listRecent(userId: string, opts?: { categoryId?: string; query?: string; take?: number }) {
    return prisma.task.findMany({
      where: {
        userId,
        ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
        ...(opts?.query ? { name: { contains: opts.query, mode: 'insensitive' } } : {}),
      },
      orderBy: { lastUsed: 'desc' },
      take: opts?.take ?? 20,
      select: { id: true, name: true, categoryId: true, lastUsed: true },
    })
  },
}
