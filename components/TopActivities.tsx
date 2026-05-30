import { formatDuration } from '@/lib/utils'

interface Activity {
  name: string
  categoryName: string
  color: string
  seconds: number
}

interface Props {
  activities: Activity[]
}

export function TopActivities({ activities }: Props) {
  if (activities.length === 0) return null

  const max = activities[0].seconds

  return (
    <div className="bg-card border rounded-xl p-4">
      <h2 className="text-sm font-medium mb-4">Top activities</h2>
      <div className="space-y-3">
        {activities.map((a, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="font-medium truncate max-w-[200px]">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.categoryName}</span>
              </span>
              <span className="text-sm font-medium tabular-nums">{formatDuration(a.seconds)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(a.seconds / max) * 100}%`,
                  backgroundColor: a.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
