export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
