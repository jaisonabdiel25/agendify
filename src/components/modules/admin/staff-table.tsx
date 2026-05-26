"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserRole } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface BusinessUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  chairName: string | null
}

interface StaffTableProps {
  users: BusinessUser[]
  totalCount: number
  maxUsers: number
  currentUserId: string
  currentUserRole: UserRole
}

function UnlinkUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleUnlink() {
    const res = await fetch(`/api/business/users/${userId}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Error al desvincular el usuario")
      setOpen(false)
      return
    }
    toast.success(`${userName} fue desvinculado del negocio`)
    setOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        aria-label={`Desvincular a ${userName}`}
        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desvincular a{" "}
              <strong>{userName}</strong> del negocio? Esta acción no se puede
              deshacer. Podrás invitarlo nuevamente si lo deseas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desvinculando...
                </>
              ) : (
                "Desvincular"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function UserActiveSwitch({
  userId,
  isActive: initialValue,
  disabled,
}: {
  userId: string
  isActive: boolean
  disabled: boolean
}) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  async function toggle() {
    const next = !isActive
    setIsActive(next)

    const res = await fetch(`/api/business/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    })

    if (!res.ok) {
      setIsActive(!next)
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Error al actualizar el usuario")
      return
    }

    startTransition(() => router.refresh())
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      onClick={toggle}
      disabled={isPending || disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isActive ? "bg-emerald-500" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200",
          isActive ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

const ROLE_LABEL: Record<UserRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  STAFF: "Staff",
}

export function StaffTable({
  users,
  totalCount,
  maxUsers,
  currentUserId,
  currentUserRole,
}: StaffTableProps) {
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN"
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Equipo</h2>
        <span className="text-sm text-muted-foreground">
          <span
            className={cn(
              "font-medium",
              totalCount >= maxUsers ? "text-destructive" : "text-foreground"
            )}
          >
            {totalCount}
          </span>
          {" / "}
          {maxUsers} usuarios
        </span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                Puesto
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Correo
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                Activo
              </th>
              {canManage && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const isOwnerSelf = user.role === "OWNER" && user.id === currentUserId
              const canUnlink =
                canManage && user.role !== "OWNER" && user.id !== currentUserId
              return (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {ROLE_LABEL[user.role]}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden mt-0.5">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {user.chairName ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <UserActiveSwitch
                      userId={user.id}
                      isActive={user.isActive}
                      disabled={isOwnerSelf}
                    />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {canUnlink && (
                        <UnlinkUserButton userId={user.id} userName={user.name} />
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No hay usuarios en este negocio.
          </div>
        )}
      </div>
    </div>
  )
}
