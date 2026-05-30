import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, created, handle } from '@/lib/api'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET /api/entries?date=YYYY-MM-DD  OR  ?from=ISO&to=ISO
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const { searchParams } = req.nextUrl

    let gte: Date | undefined
    let lte: Date | undefined

    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (date) {
      const d = parseISO(date + 'T12:00:00')
      gte = startOfDay(d)
      lte = endOfDay(d)
    } else if (from || to) {
      if (from) gte = parseISO(from)
      if (to) lte = parseISO(to)
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(gte || lte ? { startTime: { ...(gte && { gte }), ...(lte && { lte }) } } : {}),
      },
      include: {
        task: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    return ok(entries)
  })
}

const CreateEntrySchema = z.object({
  taskName: z.string().min(1).max(200),
  categoryId: z.string(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().max(86400),
  notes: z.string().optional(),
})

// POST /api/entries
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const body = await req.json()
    const data = CreateEntrySchema.parse(body)

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

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        taskId: task.id,
        categoryId: data.categoryId,
        startTime: data.startTime,
        duration: data.duration,
        notes: data.notes,
      },
      include: {
        task: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    })

    return created(entry)
  })
}
