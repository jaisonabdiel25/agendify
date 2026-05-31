export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col p-4 gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-8 w-32 rounded-lg bg-muted ml-auto" />
      </div>
      <div className="flex-1 rounded-xl bg-muted" />
    </div>
  )
}
