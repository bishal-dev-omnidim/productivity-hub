import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/get-user'
import { ok, handle } from '@/lib/api'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

// GET /api/summary?week=YYYY-MM-DD  — aggregated time breakdown for the week
export async function GET(req: NextRequest) {
  return handle(async () => {
    const userId = await getUserId()
    const weekParam = req.nextUrl.searchParams.get('week')
    const ref = weekParam ? parseISO(weekParam) : new Date()

    const weekStart = startOfWeek(ref, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(ref, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const [entries, categories] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId, deletedAt: null, startTime: { gte: weekStart, lte: weekEnd } },
        include: { category: { select: { name: true, color: true } }, task: { select: { name: true } } },
      }),
      prisma.category.findMany({ where: { userId, isArchived: false }, orderBy: { order: 'asc' } }),
    ])

    // Per-day totals (seconds) keyed by category name
    const byDay = days.map((day) => {
      const dayEntries = entries.filter((e) => {
        const d = new Date(e.startTime)
        return (
          d.getFullYear() === day.getFullYear() &&
          d.getMonth() === day.getMonth() &&
          d.getDate() === day.getDate()
        )
      })
      const perCategory: Record<string, number> = {}
      for (const cat of categories) {
        perCategory[cat.name] = dayEntries
          .filter((e) => e.categoryId === cat.id)
          .reduce((s, e) => s + e.duration, 0)
      }
      return { date: format(day, 'yyyy-MM-dd'), day: format(day, 'EEE'), perCategory }
    })

    // Category totals
    const byCategory = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        totalSeconds: entries
          .filter((e) => e.categoryId === cat.id)
          .reduce((s, e) => s + e.duration, 0),
      }))
      .filter((c) => c.totalSeconds > 0)

    // Top tasks
    const taskMap: Record<string, { name: string; categoryName: string; color: string; totalSeconds: number }> = {}
    for (const e of entries) {
      if (!taskMap[e.taskId]) {
        taskMap[e.taskId] = {
          name: e.task.name,
          categoryName: e.category.name,
          color: e.category.color,
          totalSeconds: 0,
        }
      }
      taskMap[e.taskId].totalSeconds += e.duration
    }
    const topTasks = Object.values(taskMap).sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 10)

    const totalSeconds = entries.reduce((s, e) => s + e.duration, 0)

    return ok({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      totalSeconds,
      byDay,
      byCategory,
      topTasks,
    })
  })
}
