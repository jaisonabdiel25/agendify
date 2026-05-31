import Link from "next/link"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ChairTable } from "@/components/modules/chair/chair-table"

export default async function ChairPage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const businessId = session!.user.businessId

  const [chairs, availableUsers, business] = await Promise.all([
    prisma.chair.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        businessId,
        chair: null,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: { select: { maxChairs: true } } },
    }),
  ])

  const maxChairs = business?.plan?.maxChairs ?? 1
  const activeCount = chairs.filter((c) => c.isActive).length
  const canCreate = activeCount < maxChairs
  const usagePercent = Math.min((activeCount / maxChairs) * 100, 100)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display font-light text-3xl">Puestos</h1>
          <div className="flex items-center gap-3">
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeCount} / {maxChairs} {maxChairs === 1 ? "puesto activo" : "puestos activos"}
            </p>
          </div>
        </div>

        {canCreate ? (
          <Button asChild>
            <Link href="/chair/new">
              <Plus className="h-4 w-4" />
              Nuevo puesto
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            title={`Tu plan permite hasta ${maxChairs} ${maxChairs === 1 ? "puesto activo" : "puestos activos"}`}
          >
            <Plus className="h-4 w-4" />
            Nuevo puesto
          </Button>
        )}
      </div>

      <ChairTable chairs={chairs} availableUsers={availableUsers} />
    </div>
  )
}
