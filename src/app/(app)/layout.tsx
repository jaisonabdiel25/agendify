import { AppHeader } from "@/components/modules/app-header"
import { InactivityGuard } from "@/components/modules/inactivity-guard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <InactivityGuard />
      <AppHeader />
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
}
