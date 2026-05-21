import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ChairCard } from "@/components/modules/chair/chair-card"

interface ChairDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChairDetailPage({ params }: ChairDetailPageProps) {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") redirect("/chair")

  const { id } = await params

  const chair = await prisma.chair.findFirst({
    where: { id, businessId: session.user.businessId },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      isActive: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!chair) notFound()

  // Available users: no chair assigned, plus current user of this chair (if any)
  const availableUsers = await prisma.user.findMany({
    where: {
      businessId: session.user.businessId,
      chair: null,
      id: { not: chair.userId ?? undefined },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-2">
        <Link
          href="/chair"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Puestos
        </Link>
        <h1 className="font-display font-light text-3xl">{chair.name}</h1>
        <p className="text-sm text-muted-foreground">
          Consulta y edita la información de este puesto.
        </p>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <ChairCard chair={chair} availableUsers={availableUsers} />
      </div>
    </div>
  )
}
