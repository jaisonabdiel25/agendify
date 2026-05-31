export default function StatisticsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-28 rounded-md bg-muted" />
        </div>
        <div className="h-8 w-56 rounded-lg bg-muted" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-7 w-24 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-4">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="h-[260px] rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
