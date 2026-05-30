import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, noContent, handle } from '@/lib/api'
import { categoriesService } from '@/services/categories-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isArchived: z.boolean().optional(),
})

// PATCH /api/categories/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const data = UpdateCategorySchema.parse(await req.json())
    const category = await categoriesService.update(userId, id, data)
    if (!category) throw new Error('Not found')
    return ok(category)
  })
}

// DELETE /api/categories/:id  (archives — preserves historical entries)
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const archived = await categoriesService.archive(userId, id)
    if (!archived) throw new Error('Not found')
    return noContent()
  })
}
