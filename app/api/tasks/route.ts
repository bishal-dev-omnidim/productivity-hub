import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, handle } from '@/lib/api'
import { tasksService } from '@/services/tasks-service'

export const dynamic = 'force-dynamic'

// GET /api/tasks?categoryId=...&q=...  — recent tasks for autocomplete
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const { searchParams } = req.nextUrl
    const tasks = await tasksService.listRecent(userId, {
      categoryId: searchParams.get('categoryId') ?? undefined,
      query: searchParams.get('q') ?? undefined,
    })
    return ok(tasks)
  })
}
