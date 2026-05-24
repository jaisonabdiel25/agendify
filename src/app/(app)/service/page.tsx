import Link from "next/link"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ServiceTable } from "@/components/modules/service/service-table"
import { PLAN_LIMITS } from "@/constant"

export default async function ServicePage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const businessId = session!.user.businessId

  const [services, chairs, business] = await Promise.all([
    prisma.service.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    }),
    prisma.chair.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: { select: { type: true } } },
    }),
  ])

  const planType = business?.plan?.type ?? "STANDARD"
  const maxServices = PLAN_LIMITS[planType].maxServices
  const activeCount = services.filter((s) => s.isActive).length
  const canCreate = activeCount < maxServices

  const serializedServices = services.map((s) => ({
    ...s,
    price: s.price.toString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-light text-3xl">Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} / {maxServices} {maxServices === 1 ? "servicio" : "servicios"}
          </p>
        </div>
        <Button asChild={canCreate} disabled={!canCreate} title={!canCreate ? `Tu plan permite hasta ${maxServices} ${maxServices === 1 ? "servicio activo" : "servicios activos"}` : undefined}>
          {canCreate ? (
            <Link href="/service/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo servicio
            </Link>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo servicio
            </>
          )}
        </Button>
      </div>

      <ServiceTable services={serializedServices} chairs={chairs} />
    </div>
  )
}
