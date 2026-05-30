'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimerState {
  isRunning: boolean
  taskName: string
  categoryId: string
  startedAt: number | null
}

interface TimerActions {
  startTimer: (taskName: string, categoryId: string) => void
  stopTimer: () => { taskName: string; categoryId: string; startedAt: number } | null
  clearTimer: () => void
}

interface UIState {
  isQuickAddOpen: boolean
  selectedDate: string // ISO date string YYYY-MM-DD
}

interface UIActions {
  setQuickAddOpen: (open: boolean) => void
  setSelectedDate: (date: string) => void
}

type Store = TimerState & TimerActions & UIState & UIActions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Timer state
      isRunning: false,
      taskName: '',
      categoryId: '',
      startedAt: null,

      startTimer: (taskName, categoryId) =>
        set({ isRunning: true, taskName, categoryId, startedAt: Date.now() }),

      stopTimer: () => {
        const { isRunning, taskName, categoryId, startedAt } = get()
        if (!isRunning || !startedAt) return null
        set({ isRunning: false, taskName: '', categoryId: '', startedAt: null })
        return { taskName, categoryId, startedAt }
      },

      clearTimer: () =>
        set({ isRunning: false, taskName: '', categoryId: '', startedAt: null }),

      // UI state
      isQuickAddOpen: false,
      selectedDate: new Date().toISOString().split('T')[0],

      setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'productivity-hub-store',
      partialize: (state) => ({
        isRunning: state.isRunning,
        taskName: state.taskName,
        categoryId: state.categoryId,
        startedAt: state.startedAt,
      }),
    }
  )
)
