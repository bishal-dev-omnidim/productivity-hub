import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, created, handle } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET /api/categories?includeArchived=true
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true'

    const categories = await prisma.category.findMany({
      where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: { order: 'asc' },
    })

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
    const body = await req.json()
    const data = CreateCategorySchema.parse(body)

    const lastCat = await prisma.category.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
    })

    const category = await prisma.category.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
        order: (lastCat?.order ?? -1) + 1,
      },
    })

    return created(category)
  })
}
