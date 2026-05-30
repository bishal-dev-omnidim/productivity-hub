'use client'

import { useEffect, useState, useTransition } from 'react'
import { useStore } from '@/lib/store'
import { createTimeEntry, getRecentTasks } from '@/app/actions'
import { parseDuration } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Category {
  id: string
  name: string
  color: string
}

interface Props {
  categories: Category[]
}

export function QuickAddModal({ categories }: Props) {
  const isOpen = useStore((s) => s.isQuickAddOpen)
  const setOpen = useStore((s) => s.setQuickAddOpen)
  const selectedDate = useStore((s) => s.selectedDate)

  const [taskName, setTaskName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [durationInput, setDurationInput] = useState('')
  const [notes, setNotes] = useState('')
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setOpen])

  // Load suggestions when category changes
  useEffect(() => {
    if (!isOpen) return
    getRecentTasks(categoryId).then(setSuggestions)
  }, [categoryId, isOpen])

  const filteredSuggestions = taskName.length > 0
    ? suggestions.filter((s) => s.name.toLowerCase().includes(taskName.toLowerCase()) && s.name !== taskName)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const duration = parseDuration(durationInput)
    if (!duration) {
      setError('Enter duration like: 1h30m, 90, or 1.5')
      return
    }

    const startTime = new Date(`${selectedDate}T12:00:00`)
    startTime.setSeconds(startTime.getSeconds() - duration)

    startTransition(async () => {
      try {
        await createTimeEntry({ taskName, categoryId, startTime, duration, notes: notes || undefined })
        setTaskName('')
        setDurationInput('')
        setNotes('')
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log time</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>What did you work on?</Label>
            <div className="relative">
              <Input
                autoFocus
                placeholder="e.g. Fix login bug, Team standup..."
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
              {filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
                  {filteredSuggestions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setTaskName(s.name)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input
                placeholder="1h30m, 90m, 1.5"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Any context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!taskName || !durationInput || isPending}>
              {isPending ? 'Saving...' : 'Log time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
