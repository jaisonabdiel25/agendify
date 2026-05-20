import { AppHeader } from "@/components/modules/app-header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
}
