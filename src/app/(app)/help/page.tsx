import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { OnboardingChecklist, type OnboardingStep } from "@/components/modules/help/onboarding-checklist"

export default async function HelpPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id: userId, businessId, role } = session.user
  const canManage = role === "OWNER" || role === "ADMIN"

  let steps: OnboardingStep[] = []

  if (canManage) {
    const [chairCount, serviceCount, associationCount, scheduleCount, userCount, business] =
      await Promise.all([
        prisma.chair.count({ where: { businessId, isActive: true } }),
        prisma.service.count({ where: { businessId, isActive: true } }),
        prisma.chairService.count({ where: { chair: { businessId } } }),
        prisma.chairSchedule.count({ where: { chair: { businessId } } }),
        prisma.user.count({ where: { businessId, isDeleted: false } }),
        prisma.business.findUnique({
          where: { id: businessId },
          select: { plan: { select: { canInvite: true } } },
        }),
      ])

    steps = [
      {
        title: "Configura tu negocio",
        description:
          "Revisa el nombre, la zona horaria y los datos de contacto. La zona horaria es clave para calcular la disponibilidad de las reservas.",
        href: "/business",
        done: true,
      },
      {
        title: "Crea un puesto",
        description:
          "Cada puesto representa un espacio de atención (una silla, un profesional). Puedes asignarle un usuario de tu equipo.",
        href: "/chair",
        done: chairCount > 0,
      },
      {
        title: "Crea un servicio",
        description:
          "Define qué ofreces: nombre, duración y precio. La duración determina cuánto ocupa cada reserva en el calendario.",
        href: "/service",
        done: serviceCount > 0,
      },
      {
        title: "Asocia servicios a puestos",
        description:
          'En la tabla de servicios usa "Asignar a puestos" para indicar qué puestos ofrecen cada servicio. Sin esto, los clientes no pueden reservarlo.',
        href: "/service",
        done: associationCount > 0,
      },
      {
        title: "Define los horarios",
        description:
          "Cada usuario con puesto asignado configura sus días y horas de atención. El sistema usa estos horarios para mostrar disponibilidad.",
        href: "/schedule",
        done: scheduleCount > 0,
      },
    ]

    if (business?.plan?.canInvite) {
      steps.push({
        title: "Invita a tu equipo",
        description:
          "Genera un código de invitación desde la página de tu negocio y compártelo para que tu equipo se registre y se vincule automáticamente.",
        href: "/business",
        done: userCount > 1,
        optional: true,
      })
    }
  } else {
    const chair = await prisma.chair.findFirst({
      where: { userId, isActive: true },
      select: { id: true, schedules: { select: { id: true }, take: 1 } },
    })
    const hasChair = !!chair
    const hasSchedule = hasChair && chair.schedules.length > 0

    steps = [
      {
        title: "Tienes un puesto asignado",
        description:
          "Tu administrador debe asignarte un puesto para que puedas atender reservas. Si aún no lo tienes, contáctalo.",
        done: hasChair,
      },
      {
        title: "Configura tu cronograma",
        description:
          "Define tus días y horas de atención para que los clientes puedan reservar contigo en los momentos correctos.",
        href: "/schedule",
        done: hasSchedule,
      },
      {
        title: "Completa tu perfil",
        description: "Revisa tu nombre y la información de tu cuenta desde tu perfil.",
        href: "/user",
        done: true,
      },
    ]
  }

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="space-y-2">
          <h1 className="font-display font-light text-3xl">Pon tu negocio a andar</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Sigue estos pasos para configurar tu negocio y empezar a recibir reservas."
              : "Sigue estos pasos para empezar a atender reservas."}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completed} / {total} {completed === 1 ? "paso completado" : "pasos completados"}
          </p>
        </div>

        <div className="mt-8">
          <OnboardingChecklist steps={steps} />
        </div>
      </div>
    </div>
  )
}
