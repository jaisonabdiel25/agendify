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

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  durationMinutes: z
    .number({ error: "Ingresa la duración" })
    .int()
    .min(1, "Mínimo 1 minuto"),
  price: z
    .number({ error: "Ingresa el precio" })
    .min(0, "El precio no puede ser negativo"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-checked={active}
      role="switch"
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "bg-foreground" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow-sm transition-transform ${
          active ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ServiceData {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string
  color: string
  isActive: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EditServiceForm({ service }: { service: ServiceData }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service.name,
      description: service.description ?? "",
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      color: service.color,
      isActive: service.isActive,
    },
  })

  const colorValue = watch("color")

  async function onSubmit(data: FormValues) {
    setServerError(null)
    const res = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setServerError(body.error ?? "Error al actualizar el servicio.")
      return
    }

    router.push("/service")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          placeholder="Ej. Corte de cabello"
          autoComplete="off"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción del servicio..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Duration + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="durationMinutes">Duración (minutos) *</Label>
          <Input
            id="durationMinutes"
            type="number"
            min={1}
            placeholder="30"
            {...register("durationMinutes", { valueAsNumber: true })}
            aria-invalid={!!errors.durationMinutes}
          />
          {errors.durationMinutes && (
            <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Precio ($) *</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            {...register("price", { valueAsNumber: true })}
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            {...register("color")}
            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
          />
          <span className="text-sm text-muted-foreground font-mono">{colorValue}</span>
        </div>
        {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
      </div>

      {/* isActive */}
      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Toggle active={field.value} onChange={() => field.onChange(!field.value)} />
          )}
        />
        <Label className="cursor-pointer">Servicio activo</Label>
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
            Guardando...
          </>
        ) : (
          "Guardar cambios"
        )}
      </Button>
    </form>
  )
}
