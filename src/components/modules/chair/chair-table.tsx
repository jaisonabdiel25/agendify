"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChairUser {
  id: string
  name: string
  email: string
}

interface Chair {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  user: ChairUser | null
}

interface AvailableUser {
  id: string
  name: string
  email: string
}

interface ChairTableProps {
  chairs: Chair[]
  availableUsers: AvailableUser[]
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ChairTable({ chairs, availableUsers }: ChairTableProps) {
  const router = useRouter()
  const [targetChair, setTargetChair] = useState<Chair | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [saving, setSaving] = useState(false)

  function openDialog(chair: Chair) {
    setTargetChair(chair)
    setSelectedUserId("")
  }

  function closeDialog() {
    setTargetChair(null)
    setSelectedUserId("")
  }

  async function handleAssign() {
    if (!targetChair || !selectedUserId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/chairs/${targetChair.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Error al asignar el usuario")
        return
      }

      toast.success(`Usuario asignado a ${targetChair.name}`)
      closeDialog()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (chairs.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay puestos registrados.</p>
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-120">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Nombre</th>
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Usuario asignado</th>
                <th className="hidden md:table-cell text-left px-4 py-3 font-medium text-muted-foreground text-sm">Descripción</th>
                <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Estado</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-muted-foreground text-sm">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chairs.map((chair) => (
                <tr key={chair.id} className="hover:bg-muted/20 transition-colors duration-100">
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm">{chair.name}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    {chair.user ? (
                      <span className="text-xs sm:text-sm text-muted-foreground">{chair.user.name}</span>
                    ) : (
                      <button
                        onClick={() => openDialog(chair)}
                        className="text-xs text-muted-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors italic whitespace-nowrap"
                      >
                        Sin asignar — Asignar
                      </button>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground max-w-50">
                    {chair.description ? (
                      <span className="line-clamp-1">{chair.description}</span>
                    ) : (
                      <span className="italic text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] sm:text-xs font-medium whitespace-nowrap ${
                        chair.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {chair.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(chair.createdAt).toLocaleDateString("es-PA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!targetChair} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar usuario</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona el usuario que se asignará al puesto{" "}
              <strong>{targetChair?.name}</strong>.
            </p>

            {availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay usuarios disponibles para asignar.
              </p>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
