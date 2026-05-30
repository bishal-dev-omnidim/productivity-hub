export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 h-64 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="h-48 bg-muted animate-pulse rounded-xl" />
    </div>
  )
}
