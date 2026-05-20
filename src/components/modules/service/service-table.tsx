"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string
  color: string
  isActive: boolean
}

interface Chair {
  id: string
  name: string
}

interface ServiceTableProps {
  services: Service[]
  chairs: Chair[]
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ServiceTable({ services, chairs }: ServiceTableProps) {
  const router = useRouter()
  const [targetService, setTargetService] = useState<Service | null>(null)
  const [assignedChairIds, setAssignedChairIds] = useState<string[]>([])
  const [loadingAssign, setLoadingAssign] = useState(false)
  const [saving, setSaving] = useState(false)

  async function openAssignDialog(service: Service) {
    setTargetService(service)
    setLoadingAssign(true)
    try {
      const res = await fetch(`/api/services/${service.id}/chairs`)
      if (res.ok) {
        const ids: string[] = await res.json()
        setAssignedChairIds(ids)
      }
    } finally {
      setLoadingAssign(false)
    }
  }

  function closeDialog() {
    setTargetService(null)
    setAssignedChairIds([])
  }

  function toggleChair(chairId: string) {
    setAssignedChairIds((prev) =>
      prev.includes(chairId) ? prev.filter((id) => id !== chairId) : [...prev, chairId]
    )
  }

  async function handleSaveAssignment() {
    if (!targetService) return
    setSaving(true)
    try {
      const res = await fetch(`/api/services/${targetService.id}/chairs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chairIds: assignedChairIds }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Error al guardar la asignación")
        return
      }

      toast.success(`Asignación de "${targetService.name}" actualizada`)
      closeDialog()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay servicios registrados.
      </p>
    )
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8" />
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duración</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Puestos</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: service.color }}
                  />
                </td>
                <td className="px-4 py-3 font-medium">
                  <div>
                    <p>{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {service.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {service.durationMinutes} min
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  ${Number(service.price).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      service.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {service.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openAssignDialog(service)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Asignar a puestos
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/service/${service.id}/edit`}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Dialog */}
      <Dialog open={!!targetService} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar a puestos</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona los puestos que ofrecerán{" "}
              <strong>{targetService?.name}</strong>.
            </p>

            {loadingAssign ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : chairs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay puestos activos en este negocio.
              </p>
            ) : (
              <div className="space-y-2">
                {chairs.map((chair) => (
                  <label
                    key={chair.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={assignedChairIds.includes(chair.id)}
                      onChange={() => toggleChair(chair.id)}
                      className="h-4 w-4 cursor-pointer accent-foreground"
                    />
                    <span className="text-sm">{chair.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignment} disabled={loadingAssign || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
