import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, noContent, handle } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// GET /api/entries/:id
export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params

    const entry = await prisma.timeEntry.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        task: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    })
    if (!entry) throw new Error('Not found')

    return ok(entry)
  })
}

const UpdateEntrySchema = z.object({
  taskName: z.string().min(1).max(200),
  categoryId: z.string(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().max(86400),
  notes: z.string().nullish(),
})

// PATCH /api/entries/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const body = await req.json()
    const data = UpdateEntrySchema.parse(body)

    const existing = await prisma.timeEntry.findFirst({ where: { id, userId } })
    if (!existing) throw new Error('Not found')

    const task = await prisma.task.upsert({
      where: {
        userId_categoryId_name: { userId, categoryId: data.categoryId, name: data.taskName },
      },
      update: { lastUsed: new Date() },
      create: { userId, categoryId: data.categoryId, name: data.taskName, lastUsed: new Date() },
    })

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        taskId: task.id,
        categoryId: data.categoryId,
        startTime: data.startTime,
        duration: data.duration,
        notes: data.notes ?? null,
      },
      include: {
        task: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    })

    return ok(entry)
  })
}

// DELETE /api/entries/:id  (soft delete)
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params

    const result = await prisma.timeEntry.updateMany({
      where: { id, userId },
      data: { deletedAt: new Date() },
    })
    if (result.count === 0) throw new Error('Not found')

    return noContent()
  })
}
