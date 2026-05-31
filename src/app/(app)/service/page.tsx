import Link from "next/link"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ServiceTable } from "@/components/modules/service/service-table"

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
      select: { plan: { select: { maxServices: true } } },
    }),
  ])

  const maxServices = business?.plan?.maxServices ?? 1
  const activeCount = services.filter((s) => s.isActive).length
  const canCreate = activeCount < maxServices
  const usagePercent = Math.min((activeCount / maxServices) * 100, 100)

  const serializedServices = services.map((s) => ({
    ...s,
    price: s.price.toString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display font-light text-3xl">Servicios</h1>
          <div className="flex items-center gap-3">
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeCount} / {maxServices} {maxServices === 1 ? "servicio activo" : "servicios activos"}
            </p>
          </div>
        </div>

        {canCreate ? (
          <Button asChild>
            <Link href="/service/new">
              <Plus className="h-4 w-4" />
              Nuevo servicio
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            title={`Tu plan permite hasta ${maxServices} ${maxServices === 1 ? "servicio activo" : "servicios activos"}`}
          >
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </Button>
        )}
      </div>

      <ServiceTable services={serializedServices} chairs={chairs} />
    </div>
  )
}
