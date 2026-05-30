'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getUserId } from '@/lib/get-user'
import { entriesService } from '@/services/entries-service'
import { categoriesService } from '@/services/categories-service'
import { profileService } from '@/services/profile-service'

/**
 * Server Actions — the WEB UI's mutation entrypoints.
 * These validate input, delegate persistence to the service layer, then
 * revalidate the affected routes. Read queries live in services/ and are
 * called directly from server components or the REST API.
 */

// ─── Time Entries ────────────────────────────────────────────────────────────

const EntrySchema = z.object({
  taskName: z.string().min(1).max(200),
  categoryId: z.string(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().max(86400),
  notes: z.string().optional(),
})

export async function createTimeEntry(input: unknown) {
  const userId = await getUserId()
  const data = EntrySchema.parse(input)
  await entriesService.create({ userId, ...data })
  revalidatePath('/')
}

export async function updateTimeEntry(input: unknown) {
  const userId = await getUserId()
  const { id, ...rest } = EntrySchema.extend({ id: z.string() }).parse(input)
  await entriesService.update(id, { userId, ...rest })
  revalidatePath('/')
}

export async function deleteTimeEntry(id: string) {
  const userId = await getUserId()
  await entriesService.softDelete(userId, id)
  revalidatePath('/')
}

// ─── Categories ──────────────────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function createCategory(input: unknown) {
  const userId = await getUserId()
  const { name, color } = CategorySchema.parse(input)
  await categoriesService.create(userId, name, color)
  revalidatePath('/')
  revalidatePath('/settings')
}

export async function updateCategory(input: unknown) {
  const userId = await getUserId()
  const { id, name, color } = CategorySchema.extend({ id: z.string() }).parse(input)
  await categoriesService.update(userId, id, { name, color })
  revalidatePath('/')
  revalidatePath('/settings')
}

export async function archiveCategory(id: string) {
  const userId = await getUserId()
  await categoriesService.archive(userId, id)
  revalidatePath('/')
  revalidatePath('/settings')
}

export async function updateCategoryOrder(orderedIds: string[]) {
  const userId = await getUserId()
  await categoriesService.reorder(userId, orderedIds)
  revalidatePath('/')
  revalidatePath('/settings')
}

// ─── Profile ─────────────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().min(1),
})

export async function updateProfile(input: unknown) {
  const userId = await getUserId()
  const data = ProfileSchema.parse(input)
  await profileService.update(userId, data)
  revalidatePath('/settings')
}

// ─── Reads used by client components (autocomplete) ────────────────────────────

export async function getRecentTasks(categoryId?: string) {
  const userId = await getUserId()
  const { tasksService } = await import('@/services/tasks-service')
  return tasksService.listRecent(userId, { categoryId })
}
