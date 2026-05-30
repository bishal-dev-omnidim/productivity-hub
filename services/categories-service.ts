import 'server-only'
import { prisma } from '@/lib/db'

/** Pure data-access layer for categories. */
export const categoriesService = {
  list(userId: string, includeArchived = false) {
    return prisma.category.findMany({
      where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: { order: 'asc' },
    })
  },

  async create(userId: string, name: string, color: string) {
    const last = await prisma.category.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
    })
    return prisma.category.create({
      data: { userId, name, color, order: (last?.order ?? -1) + 1 },
    })
  },

  async update(
    userId: string,
    id: string,
    data: { name?: string; color?: string; isArchived?: boolean }
  ) {
    const result = await prisma.category.updateMany({ where: { id, userId }, data })
    if (result.count === 0) return null
    return prisma.category.findUnique({ where: { id } })
  },

  async archive(userId: string, id: string) {
    const result = await prisma.category.updateMany({
      where: { id, userId },
      data: { isArchived: true },
    })
    return result.count > 0
  },

  reorder(userId: string, orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.updateMany({ where: { id, userId }, data: { order: index } })
      )
    )
  },
}
