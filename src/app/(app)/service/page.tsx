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

  const [services, chairs] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: session!.user.businessId },
      orderBy: { name: "asc" },
    }),
    prisma.chair.findMany({
      where: { businessId: session!.user.businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

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
            {services.length} {services.length === 1 ? "servicio" : "servicios"}
          </p>
        </div>
        <Button asChild>
          <Link href="/service/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo servicio
          </Link>
        </Button>
      </div>

      <ServiceTable services={serializedServices} chairs={chairs} />
    </div>
  )
}
