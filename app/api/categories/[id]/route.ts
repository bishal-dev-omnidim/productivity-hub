import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, noContent, handle } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isArchived: z.boolean().optional(),
})

// PATCH /api/categories/:id  (update name/color, or archive via { isArchived: true })
export async function PATCH(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params
    const body = await req.json()
    const data = UpdateCategorySchema.parse(body)

    const result = await prisma.category.updateMany({
      where: { id, userId },
      data,
    })
    if (result.count === 0) throw new Error('Not found')

    const category = await prisma.category.findUnique({ where: { id } })
    return ok(category)
  })
}

// DELETE /api/categories/:id  (archives — preserves historical entries)
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    const userId = await getUserId()
    const { id } = await params

    const result = await prisma.category.updateMany({
      where: { id, userId },
      data: { isArchived: true },
    })
    if (result.count === 0) throw new Error('Not found')

    return noContent()
  })
}
