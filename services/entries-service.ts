import 'server-only'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

/**
 * Pure data-access layer for time entries.
 * No React, no Next.js cache calls — safe to use from server components,
 * server actions, and API routes alike. Mutations are wrapped by callers
 * (actions.ts revalidates; API routes return JSON).
 */

export interface EntryInput {
  userId: string
  taskName: string
  categoryId: string
  startTime: Date
  duration: number
  notes?: string | null
}

const entryInclude = {
  task: { select: { name: true } },
  category: { select: { name: true, color: true } },
} as const

async function upsertTask(userId: string, categoryId: string, name: string) {
  return prisma.task.upsert({
    where: { userId_categoryId_name: { userId, categoryId, name } },
    update: { lastUsed: new Date() },
    create: { userId, categoryId, name, lastUsed: new Date() },
  })
}

export const entriesService = {
  listForDay(userId: string, day: Date) {
    return prisma.timeEntry.findMany({
      where: {
        userId,
        deletedAt: null,
        startTime: { gte: startOfDay(day), lte: endOfDay(day) },
      },
      include: entryInclude,
      orderBy: { startTime: 'asc' },
    })
  },

  listInRange(userId: string, gte?: Date, lte?: Date) {
    return prisma.timeEntry.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(gte || lte ? { startTime: { ...(gte && { gte }), ...(lte && { lte }) } } : {}),
      },
      include: entryInclude,
      orderBy: { startTime: 'desc' },
    })
  },

  getById(userId: string, id: string) {
    return prisma.timeEntry.findFirst({
      where: { id, userId, deletedAt: null },
      include: entryInclude,
    })
  },

  async create(input: EntryInput) {
    const task = await upsertTask(input.userId, input.categoryId, input.taskName)
    return prisma.timeEntry.create({
      data: {
        userId: input.userId,
        taskId: task.id,
        categoryId: input.categoryId,
        startTime: input.startTime,
        duration: input.duration,
        notes: input.notes ?? undefined,
      },
      include: entryInclude,
    })
  },

  async update(id: string, input: EntryInput) {
    const existing = await prisma.timeEntry.findFirst({ where: { id, userId: input.userId } })
    if (!existing) throw new Error('Not found')

    const task = await upsertTask(input.userId, input.categoryId, input.taskName)
    return prisma.timeEntry.update({
      where: { id },
      data: {
        taskId: task.id,
        categoryId: input.categoryId,
        startTime: input.startTime,
        duration: input.duration,
        notes: input.notes ?? null,
      },
      include: entryInclude,
    })
  },

  async softDelete(userId: string, id: string) {
    const result = await prisma.timeEntry.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() },
    })
    return result.count > 0
  },
}
