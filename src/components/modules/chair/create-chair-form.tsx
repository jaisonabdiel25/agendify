"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
  userId: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

type FormValues = z.infer<typeof schema>

interface User {
  id: string
  name: string
  email: string
}

interface CreateChairFormProps {
  users: User[]
}

export function CreateChairForm({ users }: CreateChairFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { color: "#6366f1" } })

  async function onSubmit(data: FormValues) {
    setServerError(null)

    const payload = {
      ...data,
      userId: data.userId === "none" ? undefined : data.userId,
      color: data.color,
    }

    const response = await fetch("/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al crear el puesto.")
      return
    }

    router.push("/chair")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ej. Ana García"
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

      <div className="space-y-1.5">
        <Label htmlFor="color">Color del puesto</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            {...register("color")}
            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
          />
          <span className="text-sm text-muted-foreground">
            Identifica el puesto en el calendario
          </span>
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
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {users.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay usuarios disponibles para asignar.
          </p>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando...
          </>
        ) : (
          "Crear puesto"
        )}
      </Button>
    </form>
  )
}
