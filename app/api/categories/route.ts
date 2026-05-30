import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, created, handle } from '@/lib/api'
import { categoriesService } from '@/services/categories-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET /api/categories?includeArchived=true
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'
    const categories = await categoriesService.list(userId, includeArchived)
    return ok(categories)
  })
}

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

// POST /api/categories
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const { name, color } = CreateCategorySchema.parse(await req.json())
    const category = await categoriesService.create(userId, name, color)
    return created(category)
  })
}
