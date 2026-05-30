'use client'

import { useState } from 'react'
import { formatDuration, formatTime } from '@/lib/utils'
import { deleteTimeEntry } from '@/app/actions'
import { Button } from './ui/button'
import { Trash2, Pencil, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { EntryEditModal } from './EntryEditModal'

interface Category {
  id: string
  name: string
  color: string
  order: number
  isArchived: boolean
  createdAt: string
}

interface Entry {
  id: string
  taskId: string
  categoryId: string
  startTime: string
  duration: number
  notes: string | null
  task: { id: string; name: string; categoryId: string; userId: string; notes: string | null; lastUsed: string | null; createdAt: string }
  category: { id: string; name: string; color: string }
}

interface Props {
  entries: Entry[]
  categories: Category[]
  dateStr: string
}

export function DailyTimeline({ entries, categories, dateStr }: Props) {
  const setQuickAddOpen = useStore((s) => s.setQuickAddOpen)
  const setSelectedDate = useStore((s) => s.setSelectedDate)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await deleteTimeEntry(id)
    setDeleting(null)
  }

  const openQuickAdd = () => {
    setSelectedDate(dateStr)
    setQuickAddOpen(true)
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
          <Plus className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No entries yet</p>
          <p className="text-sm text-muted-foreground">Log what you worked on today</p>
        </div>
        <Button onClick={openQuickAdd}>Add first entry</Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
          >
            {/* Color bar */}
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: entry.category.color }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm leading-snug">{entry.task.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.category.name} · {formatTime(new Date(entry.startTime))} ·{' '}
                    {formatDuration(entry.duration)}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive"
                    disabled={deleting === entry.id}
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-2" onClick={openQuickAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add entry
        </Button>
      </div>

      {editingEntry && (
        <EntryEditModal
          entry={editingEntry}
          categories={categories}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  )
}
