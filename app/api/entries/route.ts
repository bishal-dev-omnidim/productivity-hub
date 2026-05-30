import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, created, handle } from '@/lib/api'
import { entriesService } from '@/services/entries-service'
import { parseISO } from 'date-fns'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET /api/entries?date=YYYY-MM-DD  OR  ?from=ISO&to=ISO
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const { searchParams } = req.nextUrl
    const date = searchParams.get('date')

    if (date) {
      const entries = await entriesService.listForDay(userId, parseISO(date + 'T12:00:00'))
      return ok(entries)
    }

    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const entries = await entriesService.listInRange(
      userId,
      from ? parseISO(from) : undefined,
      to ? parseISO(to) : undefined
    )
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
    const data = CreateEntrySchema.parse(await req.json())
    const entry = await entriesService.create({ userId, ...data })
    return created(entry)
  })
}
