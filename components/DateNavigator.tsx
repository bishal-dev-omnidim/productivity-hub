'use client'

import { useRouter } from 'next/navigation'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export function DateNavigator({ currentDate }: { currentDate: string }) {
  const router = useRouter()
  const date = parseISO(currentDate)
  const today = new Date().toISOString().split('T')[0]
  const isToday = currentDate === today

  const navigate = (d: Date) => {
    const str = d.toISOString().split('T')[0]
    if (str === today) {
      router.push('/')
    } else {
      router.push(`/?date=${str}`)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => navigate(subDays(date, 1))}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {!isToday && (
        <Button variant="outline" size="sm" onClick={() => navigate(new Date())}>
          <CalendarDays className="w-3.5 h-3.5 mr-1" />
          Today
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={isToday}
        onClick={() => navigate(addDays(date, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
