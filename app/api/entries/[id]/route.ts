import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, noContent, handle } from '@/lib/api'
import { entriesService } from '@/services/entries-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// GET /api/entries/:id
export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const entry = await entriesService.getById(userId, id)
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
    const data = UpdateEntrySchema.parse(await req.json())
    const entry = await entriesService.update(id, { userId, ...data })
    return ok(entry)
  })
}

// DELETE /api/entries/:id  (soft delete)
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const deleted = await entriesService.softDelete(userId, id)
    if (!deleted) throw new Error('Not found')
    return noContent()
  })
}
