'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

interface Props {
  name: string
  timezone: string
}

export function ProfileForm({ name: initialName, timezone: initialTz }: Props) {
  const [name, setName] = useState(initialName)
  const [timezone, setTimezone] = useState(initialTz)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await updateProfile({ name, timezone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>

      <div className="space-y-1.5">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {saved ? 'Saved!' : isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
