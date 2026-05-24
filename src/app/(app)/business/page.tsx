import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { BusinessCard } from "@/components/modules/business/business-card"

export default async function BusinessPage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [business, invitation] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.user.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        timezone: true,
        address: true,
        createdAt: true,
        plan: { select: { id: true, name: true, type: true, maxUsers: true, canInvite: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.invitation.findFirst({
      where: { businessId: session.user.businessId, usedAt: null },
      select: { id: true, code: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-2">
        <h1 className="font-display font-light text-3xl">Negocio</h1>
        <p className="text-sm text-muted-foreground">
          Información general y configuración de tu negocio.
        </p>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <BusinessCard
          business={{ ...business, createdAt: business.createdAt.toISOString() }}
          invitation={invitation ? { ...invitation, createdAt: invitation.createdAt.toISOString() } : null}
          plan={business.plan}
          userCount={business._count.users}
        />
      </div>
    </div>
  )
}
