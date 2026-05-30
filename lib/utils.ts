import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase()

  // e.g. "1h30m" or "2h" or "45m"
  const hhmm = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?$/)
  if (hhmm && (hhmm[1] || hhmm[2])) {
    const h = parseInt(hhmm[1] ?? '0')
    const m = parseInt(hhmm[2] ?? '0')
    return h * 3600 + m * 60
  }

  // e.g. "1.5" (hours as decimal)
  const decimal = parseFloat(trimmed)
  if (!isNaN(decimal) && /^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.round(decimal * 3600)
  }

  // e.g. "90" (minutes)
  const mins = parseInt(trimmed)
  if (!isNaN(mins) && /^\d+$/.test(trimmed)) {
    return mins * 60
  }

  return null
}
