export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, eachDayOfInterval, parseISO } from 'date-fns'
import { WeeklyChart } from '@/components/WeeklyChart'
import { TopActivities } from '@/components/TopActivities'
import { formatDuration } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function WeekPage({ searchParams }: PageProps) {
  const session = await auth()
  const params = await searchParams

  const weekRef = params.week
    ? parseISO(params.week + '-01')
    : new Date()

  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekRef, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: session!.user.id,
      startTime: { gte: weekStart, lte: weekEnd },
      deletedAt: null,
    },
    include: { category: true, task: true },
  })

  const categories = await prisma.category.findMany({
    where: { userId: session!.user.id, isArchived: false },
    orderBy: { order: 'asc' },
  })

  // Build chart data: one item per day
  const chartData = days.map((day) => {
    const dayStr = format(day, 'EEE')
    const dayEntries = entries.filter((e) => {
      const d = new Date(e.startTime)
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      )
    })

    const row: Record<string, number | string> = { day: dayStr }
    for (const cat of categories) {
      const secs = dayEntries
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.duration, 0)
      row[cat.name] = +(secs / 3600).toFixed(2)
    }
    return row
  })

  // Category totals for pie chart
  const catTotals = categories.map((cat) => ({
    name: cat.name,
    color: cat.color,
    value: entries
      .filter((e) => e.categoryId === cat.id)
      .reduce((s, e) => s + e.duration, 0),
  })).filter((c) => c.value > 0)

  const totalSeconds = entries.reduce((s, e) => s + e.duration, 0)

  // Task totals for top activities
  const taskTotals = Object.values(
    entries.reduce<Record<string, { name: string; categoryName: string; color: string; seconds: number }>>(
      (acc, e) => {
        const key = e.taskId
        if (!acc[key]) {
          acc[key] = {
            name: e.task.name,
            categoryName: e.category.name,
            color: e.category.color,
            seconds: 0,
          }
        }
        acc[key].seconds += e.duration
        return acc
      },
      {}
    )
  ).sort((a, b) => b.seconds - a.seconds)

  // Week navigation
  const prevWeek = format(startOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 }), 'yyyy-\'W\'II')
  const nextWeek = format(startOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 }), 'yyyy-\'W\'II')
  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isCurrentWeek ? 'This Week' : `Week of ${format(weekStart, 'MMM d')}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')} ·{' '}
            {totalSeconds > 0 ? formatDuration(totalSeconds) + ' total' : 'No entries'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/week?week=${prevWeek}`}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </Button>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/week">This week</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" disabled={isCurrentWeek} asChild>
            <Link href={`/week?week=${nextWeek}`}>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {totalSeconds === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No time logged this week yet.
        </div>
      ) : (
        <>
          <WeeklyChart
            chartData={chartData}
            catTotals={catTotals}
            categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          />
          <TopActivities activities={taskTotals.slice(0, 10)} />
        </>
      )}
    </div>
  )
}
