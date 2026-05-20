import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { EditServiceForm } from "@/components/modules/service/edit-service-form"

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params

  const service = await prisma.service.findFirst({
    where: { id, businessId: session!.user.businessId },
  })

  if (!service) notFound()

  const serialized = {
    ...service,
    price: service.price.toString(),
  }

  return (
    <div className="p-6 max-w-xl">
      <Link
        href="/service"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a servicios
      </Link>

      <div className="mb-8">
        <h1 className="font-display font-light text-3xl">Editar servicio</h1>
        <p className="text-sm text-muted-foreground mt-1">{service.name}</p>
      </div>

      <EditServiceForm service={serialized} />
    </div>
  )
}
