import Link from "next/link"
import { Plus } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"

export default async function ChairPage() {
  const session = await auth()

  const chairs = await prisma.chair.findMany({
    where: { businessId: session!.user.businessId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  const canManage = session!.user.role === "OWNER" || session!.user.role === "ADMIN"

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-light text-3xl">Puestos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {chairs.length} {chairs.length === 1 ? "puesto" : "puestos"}
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/chair/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo puesto
            </Link>
          </Button>
        )}
      </div>

      {chairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay puestos registrados.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario asignado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chairs.map((chair) => (
                <tr key={chair.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{chair.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chair.user ? (
                      <span>{chair.user.name}</span>
                    ) : (
                      <span className="italic text-muted-foreground/50">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {chair.description ?? (
                      <span className="italic text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        chair.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {chair.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(chair.createdAt).toLocaleDateString("es-PA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
