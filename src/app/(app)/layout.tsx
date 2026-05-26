import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AppHeader } from "@/components/modules/app-header"
import { InactivityGuard } from "@/components/modules/inactivity-guard"
import { StaffAlerts } from "@/components/modules/staff-alerts"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  let hasChair = true
  let hasSchedule = true
  const role = session?.user?.role

  if (session?.user?.id && role) {
    const chair = await prisma.chair.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, schedules: { select: { id: true }, take: 1 } },
    })
    hasChair = !!chair
    hasSchedule = !!chair && chair.schedules.length > 0
  }

  return (
    <div className="h-screen flex flex-col">
      <InactivityGuard />
      <AppHeader />
      {!!role && (
        <StaffAlerts hasChair={hasChair} hasSchedule={hasSchedule} role={role} />
      )}
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
}
