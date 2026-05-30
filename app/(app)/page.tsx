export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, format, subDays, addDays } from 'date-fns'
import { DailyTimeline } from '@/components/timeline/daily-timeline'
import { DateNavigator } from '@/components/layout/date-navigator'
import { formatDuration } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function TodayPage({ searchParams }: PageProps) {
  const session = await auth()
  const params = await searchParams
  const dateStr = params.date ?? new Date().toISOString().split('T')[0]
  const date = new Date(dateStr + 'T12:00:00') // noon to avoid timezone day shifts

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: session!.user.id,
      startTime: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      deletedAt: null,
    },
    include: { task: true, category: true },
    orderBy: { startTime: 'asc' },
  })

  const categories = await prisma.category.findMany({
    where: { userId: session!.user.id, isArchived: false },
    orderBy: { order: 'asc' },
  })

  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0)

  // Category breakdown
  const catTotals = entries.reduce<Record<string, { name: string; color: string; seconds: number }>>(
    (acc, e) => {
      if (!acc[e.categoryId]) {
        acc[e.categoryId] = { name: e.category.name, color: e.category.color, seconds: 0 }
      }
      acc[e.categoryId].seconds += e.duration
      return acc
    },
    {}
  )

  const isToday = dateStr === new Date().toISOString().split('T')[0]

  const serialized = entries.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    deletedAt: e.deletedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    task: {
      ...e.task,
      lastUsed: e.task.lastUsed?.toISOString() ?? null,
      createdAt: e.task.createdAt.toISOString(),
    },
    category: {
      ...e.category,
      createdAt: e.category.createdAt.toISOString(),
    },
  }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isToday ? 'Today' : format(date, 'EEEE, MMM d')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isToday ? format(date, 'EEEE, MMMM d') : format(date, 'MMMM d, yyyy')}
          </p>
        </div>
        <DateNavigator currentDate={dateStr} />
      </div>

      {/* Summary bar */}
      {totalSeconds > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.values(catTotals).map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}: {formatDuration(cat.seconds)}
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border">
            Total: {formatDuration(totalSeconds)}
          </div>
        </div>
      )}

      {/* Timeline */}
      <DailyTimeline
        entries={serialized}
        categories={categories.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))}
        dateStr={dateStr}
      />
    </div>
  )
}
