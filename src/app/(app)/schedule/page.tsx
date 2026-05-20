import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ScheduleForm } from "@/components/modules/schedule/schedule-form"

export default async function SchedulePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const chair = await prisma.chair.findFirst({
    where: { userId: session.user.id, businessId: session.user.businessId },
    select: {
      id: true,
      name: true,
      schedules: {
        select: { dayOfWeek: true, isActive: true, openTime: true, closeTime: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  })

  if (!chair) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-sm text-muted-foreground max-w-sm">
          No tienes un puesto asignado. Pide al administrador que te asigne uno para poder configurar tu cronograma.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-light text-3xl">Cronograma</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Horarios de atención para <strong>{chair.name}</strong>.
        </p>
      </div>
      <ScheduleForm chair={chair} />
    </div>
  )
}
