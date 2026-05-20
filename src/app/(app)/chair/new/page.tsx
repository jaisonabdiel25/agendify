import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreateChairForm } from "@/components/modules/chair/create-chair-form"

export default async function NewChairPage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") redirect("/chair")

  const users = await prisma.user.findMany({
    where: { businessId: session.user.businessId, chair: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-6 max-w-lg">
      <Link
        href="/chair"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Puestos
      </Link>

      <div className="mb-6">
        <h1 className="font-display font-light text-3xl">Nuevo puesto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Puedes asignar un usuario del equipo o dejarlo sin asignar por ahora.
        </p>
      </div>

      <CreateChairForm users={users} />
    </div>
  )
}
