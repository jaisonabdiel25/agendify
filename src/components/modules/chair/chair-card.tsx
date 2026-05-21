"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isActive: z.boolean(),
  userId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ChairUser {
  id: string
  name: string
  email: string
}

interface Chair {
  id: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  userId: string | null
  user: ChairUser | null
}

interface AvailableUser {
  id: string
  name: string
  email: string
}

interface ChairCardProps {
  chair: Chair
  availableUsers: AvailableUser[]
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{value ?? <span className="italic text-muted-foreground/50">—</span>}</div>
    </div>
  )
}

export function ChairCard({ chair, availableUsers }: ChairCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: chair.name,
      description: chair.description ?? "",
      color: chair.color,
      isActive: chair.isActive,
      userId: chair.userId ?? "none",
    },
  })

  function handleCancel() {
    reset()
    setServerError(null)
    setIsEditing(false)
  }

  async function onSubmit(data: FormValues) {
    setServerError(null)

    const payload = {
      ...data,
      userId: data.userId === "none" ? null : (data.userId ?? null),
    }

    const response = await fetch(`/api/chairs/${chair.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al guardar los cambios.")
      return
    }

    setIsEditing(false)
    router.refresh()
  }

  // All selectable users: available + current (if any), deduplicated
  const selectableUsers: AvailableUser[] = chair.user
    ? [chair.user, ...availableUsers.filter((u) => u.id !== chair.user!.id)]
    : availableUsers

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-medium text-sm">Información del puesto</h2>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cancelar
          </Button>
        )}
      </div>

      <div className="px-6 py-5">
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <InfoRow label="Nombre" value={chair.name} />
            </div>
            <InfoRow
              label="Color"
              value={
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: chair.color }}
                  />
                  <span className="font-mono text-xs">{chair.color}</span>
                </div>
              }
            />
            <InfoRow
              label="Estado"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    chair.isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {chair.isActive ? "Activo" : "Inactivo"}
                </span>
              }
            />
            <InfoRow
              label="Usuario asignado"
              value={chair.user ? `${chair.user.name} · ${chair.user.email}` : <span className="italic text-muted-foreground/50">Sin asignar</span>}
            />
            <div className="sm:col-span-2">
              <InfoRow label="Descripción" value={chair.description ?? null} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                autoComplete="off"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Especialidad, notas adicionales..."
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="color">Color del puesto</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    {...register("color")}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                  />
                  <span className="text-sm text-muted-foreground">Identifica el puesto en el calendario</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-3 h-9">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          field.value ? "bg-primary" : "bg-input"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                            field.value ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="userId">Usuario asignado</Label>
              <Controller
                control={control}
                name="userId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {selectableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} · {u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
