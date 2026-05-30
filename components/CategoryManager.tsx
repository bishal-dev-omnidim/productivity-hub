'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createCategory, updateCategory, archiveCategory, updateCategoryOrder } from '@/app/actions'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { GripVertical, Plus, Archive, Pencil, Check, X } from 'lucide-react'

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#a3a3a3',
]

interface Category {
  id: string
  name: string
  color: string
  order: number
  isArchived: boolean
}

function SortableItem({
  cat,
  onArchive,
}: {
  cat: Category
  onArchive: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(cat.name)
  const [editColor, setEditColor] = useState(cat.color)
  const [isPending, startTransition] = useTransition()

  const saveEdit = () => {
    startTransition(async () => {
      await updateCategory({ id: cat.id, name: editName, color: editColor })
      setEditing(false)
    })
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1">
        <GripVertical className="w-4 h-4" />
      </button>

      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            className="h-8 flex-1"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <Button size="icon" className="w-7 h-7" disabled={isPending} onClick={saveEdit}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setEditing(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 py-2 rounded-lg hover:bg-accent/30 px-2 transition-colors">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="text-sm flex-1">{cat.name}</span>
          {cat.isArchived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!cat.isArchived && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground"
                onClick={() => onArchive(cat.id)}
              >
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PALETTE[0])
  const [isCreating, startCreateTransition] = useTransition()
  const [, startArchiveTransition] = useTransition()
  const [, startReorderTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    setCategories(reordered)
    startReorderTransition(() => {
      updateCategoryOrder(reordered.map((c) => c.id))
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    startCreateTransition(async () => {
      await createCategory({ name: newName, color: newColor })
      setNewName('')
      setNewColor(PALETTE[0])
      setShowNew(false)
      setCategories((prev) => [
        ...prev,
        { id: Math.random().toString(), name: newName, color: newColor, order: prev.length, isArchived: false },
      ])
    })
  }

  const handleArchive = (id: string) => {
    startArchiveTransition(async () => {
      await archiveCategory(id)
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c))
      )
    })
  }

  const active = categories.filter((c) => !c.isArchived)
  const archived = categories.filter((c) => c.isArchived)

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {active.map((cat) => (
              <SortableItem key={cat.id} cat={cat} onArchive={handleArchive} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {archived.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2">Archived</p>
          {archived.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full opacity-50" style={{ backgroundColor: cat.color }} />
              {cat.name}
              <Badge variant="secondary" className="text-xs ml-auto">Archived</Badge>
            </div>
          ))}
        </div>
      )}

      {showNew ? (
        <form onSubmit={handleCreate} className="border rounded-lg p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Design, Research..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${newColor === c ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newName || isCreating}>
              {isCreating ? 'Creating...' : 'Create category'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add category
        </Button>
      )}
    </div>
  )
}
