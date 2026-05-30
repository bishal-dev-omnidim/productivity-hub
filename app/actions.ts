'use server'

import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Time Entry Actions ─────────────────────────────────────────────────────

const CreateEntrySchema = z.object({
  taskName: z.string().min(1).max(200),
  categoryId: z.string(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().max(86400),
  notes: z.string().optional(),
})

export async function createTimeEntry(input: unknown) {
  const userId = await getUserId()
  const data = CreateEntrySchema.parse(input)

  const task = await prisma.task.upsert({
    where: {
      userId_categoryId_name: {
        userId,
        categoryId: data.categoryId,
        name: data.taskName,
      },
    },
    update: { lastUsed: new Date() },
    create: {
      userId,
      categoryId: data.categoryId,
      name: data.taskName,
      lastUsed: new Date(),
    },
  })

  await prisma.timeEntry.create({
    data: {
      userId,
      taskId: task.id,
      categoryId: data.categoryId,
      startTime: data.startTime,
      duration: data.duration,
      notes: data.notes,
    },
  })

  revalidatePath('/')
}

const UpdateEntrySchema = z.object({
  id: z.string(),
  taskName: z.string().min(1).max(200),
  categoryId: z.string(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().max(86400),
  notes: z.string().optional(),
})

export async function updateTimeEntry(input: unknown) {
  const userId = await getUserId()
  const data = UpdateEntrySchema.parse(input)

  const existing = await prisma.timeEntry.findFirst({
    where: { id: data.id, userId },
  })
  if (!existing) throw new Error('Not found')

  const task = await prisma.task.upsert({
    where: {
      userId_categoryId_name: {
        userId,
        categoryId: data.categoryId,
        name: data.taskName,
      },
    },
    update: { lastUsed: new Date() },
    create: {
      userId,
      categoryId: data.categoryId,
      name: data.taskName,
      lastUsed: new Date(),
    },
  })

  await prisma.timeEntry.update({
    where: { id: data.id },
    data: {
      taskId: task.id,
      categoryId: data.categoryId,
      startTime: data.startTime,
      duration: data.duration,
      notes: data.notes ?? null,
    },
  })

  revalidatePath('/')
}

export async function deleteTimeEntry(id: string) {
  const userId = await getUserId()

  await prisma.timeEntry.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/')
}

// ─── Category Actions ───────────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function createCategory(input: unknown) {
  const userId = await getUserId()
  const data = CategorySchema.parse(input)

  const lastCat = await prisma.category.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
  })

  await prisma.category.create({
    data: {
      userId,
      name: data.name,
      color: data.color,
      order: (lastCat?.order ?? -1) + 1,
    },
  })

  revalidatePath('/')
  revalidatePath('/settings')
}

const UpdateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function updateCategory(input: unknown) {
  const userId = await getUserId()
  const data = UpdateCategorySchema.parse(input)

  await prisma.category.updateMany({
    where: { id: data.id, userId },
    data: { name: data.name, color: data.color },
  })

  revalidatePath('/')
  revalidatePath('/settings')
}

export async function archiveCategory(id: string) {
  const userId = await getUserId()

  await prisma.category.updateMany({
    where: { id, userId },
    data: { isArchived: true },
  })

  revalidatePath('/')
  revalidatePath('/settings')
}

export async function updateCategoryOrder(orderedIds: string[]) {
  const userId = await getUserId()

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    )
  )

  revalidatePath('/')
  revalidatePath('/settings')
}

// ─── Profile Actions ─────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().min(1),
})

export async function updateProfile(input: unknown) {
  const userId = await getUserId()
  const data = ProfileSchema.parse(input)

  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, timezone: data.timezone },
  })

  revalidatePath('/settings')
}

// ─── Task Autocomplete ───────────────────────────────────────────────────────

export async function getRecentTasks(categoryId?: string) {
  const userId = await getUserId()

  return prisma.task.findMany({
    where: {
      userId,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { lastUsed: 'desc' },
    take: 20,
    select: { id: true, name: true, categoryId: true },
  })
}
