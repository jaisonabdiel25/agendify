export default function BookingLoading() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-56 rounded-md bg-muted" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-11 bg-muted/60 border-b border-border" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
