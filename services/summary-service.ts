import 'server-only'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'

/** Aggregated weekly time breakdown — shared by the week page and the API route. */
export const summaryService = {
  async week(userId: string, ref: Date) {
    const weekStart = startOfWeek(ref, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(ref, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const [entries, categories] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId, deletedAt: null, startTime: { gte: weekStart, lte: weekEnd } },
        include: {
          category: { select: { name: true, color: true } },
          task: { select: { name: true } },
        },
      }),
      prisma.category.findMany({ where: { userId, isArchived: false }, orderBy: { order: 'asc' } }),
    ])

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

    const byDay = days.map((day) => {
      const dayEntries = entries.filter((e) => sameDay(new Date(e.startTime), day))
      const perCategory: Record<string, number> = {}
      for (const cat of categories) {
        perCategory[cat.name] = dayEntries
          .filter((e) => e.categoryId === cat.id)
          .reduce((s, e) => s + e.duration, 0)
      }
      return { date: format(day, 'yyyy-MM-dd'), day: format(day, 'EEE'), perCategory }
    })

    const byCategory = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        totalSeconds: entries.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.duration, 0),
      }))
      .filter((c) => c.totalSeconds > 0)

    const taskMap: Record<string, { name: string; categoryName: string; color: string; totalSeconds: number }> = {}
    for (const e of entries) {
      if (!taskMap[e.taskId]) {
        taskMap[e.taskId] = { name: e.task.name, categoryName: e.category.name, color: e.category.color, totalSeconds: 0 }
      }
      taskMap[e.taskId].totalSeconds += e.duration
    }
    const topTasks = Object.values(taskMap).sort((a, b) => b.totalSeconds - a.totalSeconds)

    const totalSeconds = entries.reduce((s, e) => s + e.duration, 0)

    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      totalSeconds,
      byDay,
      byCategory,
      topTasks,
      entries,
      categories,
    }
  },
}
