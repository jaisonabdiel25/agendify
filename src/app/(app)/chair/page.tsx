import Link from "next/link"
import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ChairTable } from "@/components/modules/chair/chair-table"
import { PLAN_LIMITS } from "@/constant"

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
      select: { plan: { select: { type: true } } },
    }),
  ])

  const planType = business?.plan?.type ?? "STANDARD"
  const maxChairs = PLAN_LIMITS[planType].maxChairs
  const activeCount = chairs.filter((c) => c.isActive).length
  const canCreate = activeCount < maxChairs

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-light text-3xl">Puestos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} / {maxChairs} {maxChairs === 1 ? "puesto activo" : "puestos activos"}
          </p>
        </div>
        <Button asChild={canCreate} disabled={!canCreate} title={!canCreate ? `Tu plan permite hasta ${maxChairs} ${maxChairs === 1 ? "puesto activo" : "puestos activos"}` : undefined}>
          {canCreate ? (
            <Link href="/chair/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo puesto
            </Link>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo puesto
            </>
          )}
        </Button>
      </div>

      <ChairTable chairs={chairs} availableUsers={availableUsers} />
    </div>
  )
}
