import 'server-only'
import { prisma } from '@/lib/db'

/** Pure data-access layer for the user profile. */
export const profileService = {
  get(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } })
  },

  update(userId: string, data: { name: string; timezone: string }) {
    return prisma.user.update({ where: { id: userId }, data })
  },
}
