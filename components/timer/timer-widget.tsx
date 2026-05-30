'use client'

import { useEffect, useState, useTransition } from 'react'
import { useStore } from '@/lib/store'
import { createTimeEntry } from '@/app/actions'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Square, Play, Timer } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
}

interface Props {
  categories: Category[]
}

export function TimerWidget({ categories }: Props) {
  const { isRunning, taskName, categoryId, startedAt, startTimer, stopTimer, clearTimer } = useStore()
  const [elapsed, setElapsed] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()

  // Tick
  useEffect(() => {
    if (!isRunning || !startedAt) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, startedAt])

  const handleStop = () => {
    const result = stopTimer()
    if (!result) return

    const duration = Math.floor((Date.now() - result.startedAt) / 1000)
    if (duration < 60) {
      clearTimer()
      return
    }

    startTransition(async () => {
      await createTimeEntry({
        taskName: result.taskName,
        categoryId: result.categoryId,
        startTime: new Date(result.startedAt),
        duration,
      })
    })
  }

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskName.trim()) return
    startTimer(newTaskName.trim(), newCategoryId)
    setNewTaskName('')
    setIsExpanded(false)
  }

  if (isRunning) {
    return (
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-card border shadow-lg rounded-xl px-4 py-3 z-50">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{
            backgroundColor:
              categories.find((c) => c.id === categoryId)?.color ?? '#6366f1',
          }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[160px]">{taskName}</p>
          <p className="text-xs text-muted-foreground font-mono">{formatDuration(elapsed)}</p>
        </div>
        <Button
          variant="destructive"
          size="icon"
          className="w-8 h-8 shrink-0"
          disabled={isPending}
          onClick={handleStop}
        >
          <Square className="w-3.5 h-3.5" />
        </Button>
      </div>
    )
  }

  if (isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 bg-card border shadow-lg rounded-xl p-4 z-50 w-72 space-y-3">
        <form onSubmit={handleStart} className="space-y-3">
          <Input
            autoFocus
            placeholder="What are you working on?"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
          />
          <Select value={newCategoryId} onValueChange={setNewCategoryId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsExpanded(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!newTaskName.trim()}>
              Start
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg z-50"
      onClick={() => setIsExpanded(true)}
    >
      <Timer className="w-5 h-5" />
    </Button>
  )
}
