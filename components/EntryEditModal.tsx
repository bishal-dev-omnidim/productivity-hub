'use client'

import { useState, useTransition } from 'react'
import { updateTimeEntry } from '@/app/actions'
import { parseDuration, formatDuration } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { format } from 'date-fns'

interface Category {
  id: string
  name: string
  color: string
}

interface Entry {
  id: string
  taskId: string
  categoryId: string
  startTime: string
  duration: number
  notes: string | null
  task: { name: string }
}

interface Props {
  entry: Entry
  categories: Category[]
  onClose: () => void
}

export function EntryEditModal({ entry, categories, onClose }: Props) {
  const [taskName, setTaskName] = useState(entry.task.name)
  const [categoryId, setCategoryId] = useState(entry.categoryId)
  const [durationInput, setDurationInput] = useState(() => {
    const h = Math.floor(entry.duration / 3600)
    const m = Math.floor((entry.duration % 3600) / 60)
    return h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`
  })
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const duration = parseDuration(durationInput)
    if (!duration) {
      setError('Enter duration like: 1h30m, 90m, or 1.5')
      return
    }
    startTransition(async () => {
      try {
        await updateTimeEntry({
          id: entry.id,
          taskName,
          categoryId,
          startTime: new Date(entry.startTime),
          duration,
          notes: notes || undefined,
        })
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} autoFocus />
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
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="1h30m"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!taskName || isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
