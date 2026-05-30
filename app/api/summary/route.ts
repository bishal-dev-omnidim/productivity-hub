import type { NextRequest } from 'next/server'
import { getUserId } from '@/lib/get-user'
import { ok, handle } from '@/lib/api'
import { summaryService } from '@/services/summary-service'
import { parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/summary?week=YYYY-MM-DD  — aggregated weekly breakdown
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const weekParam = req.nextUrl.searchParams.get('week')
    const ref = weekParam ? parseISO(weekParam) : new Date()
    const summary = await summaryService.week(userId, ref)

    // Omit the raw entries/categories arrays from the public API response
    const { entries: _e, categories: _c, ...payload } = summary
    return ok(payload)
  })
}
