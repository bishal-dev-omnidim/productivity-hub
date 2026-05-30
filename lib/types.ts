export interface CategoryData {
  id: string
  name: string
  color: string
  order: number
  isArchived: boolean
}

export interface TaskData {
  id: string
  name: string
  categoryId: string
  lastUsed: Date | null
}

export interface TimeEntryData {
  id: string
  taskId: string
  categoryId: string
  startTime: Date
  duration: number
  notes: string | null
  task: {
    name: string
  }
  category: {
    name: string
    color: string
  }
}
