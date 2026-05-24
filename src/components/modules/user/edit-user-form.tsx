"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().max(200, "La descripción no puede superar los 200 caracteres").optional(),
})

type FormValues = z.infer<typeof schema>

interface UserProfileCardProps {
  user: {
    id: string
    name: string
    description: string | null
  }
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? <span className="italic text-muted-foreground/50">—</span>}</p>
    </div>
  )
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      description: user.description ?? "",
    },
  })

  function handleCancel() {
    reset()
    setServerError(null)
    setIsEditing(false)
  }

  async function onSubmit(data: FormValues) {
    setServerError(null)

    const response = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al guardar los cambios.")
      return
    }

    setIsEditing(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-medium text-sm">Información del perfil</h2>
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
          <div className="grid grid-cols-1 gap-5">
            <InfoRow label="Nombre" value={user.name} />
            <InfoRow label="Descripción" value={user.description} />
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
                placeholder="Cuéntanos un poco sobre ti..."
                rows={3}
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
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
