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
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-2">
        <Link
          href="/service"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a servicios
        </Link>
        <h1 className="font-display font-light text-3xl">Editar servicio</h1>
        <p className="text-sm text-muted-foreground">{service.name}</p>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <EditServiceForm service={serialized} />
      </div>
    </div>
  )
}
