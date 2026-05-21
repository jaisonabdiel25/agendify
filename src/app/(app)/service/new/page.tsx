import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { CreateServiceForm } from "@/components/modules/service/create-service-form"

export default async function NewServicePage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
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
        <h1 className="font-display font-light text-3xl">Nuevo servicio</h1>
        <p className="text-sm text-muted-foreground">
          Agrega un servicio que ofrecerá tu negocio.
        </p>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <CreateServiceForm />
      </div>
    </div>
  )
}
