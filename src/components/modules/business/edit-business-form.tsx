"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  timezone: z.string().min(1, "La zona horaria es requerida"),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Business {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
  timezone: string
  address: string | null
  createdAt: string
}

interface EditBusinessFormProps {
  business: Business
}

export function EditBusinessForm({ business }: EditBusinessFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: business.name,
      phone: business.phone ?? "",
      email: business.email ?? "",
      timezone: business.timezone,
      address: business.address ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    setServerError(null)
    setSuccess(false)

    const response = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al guardar los cambios.")
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del negocio *</Label>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+507 6000-0000"
            autoComplete="off"
            {...register("phone")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="negocio@ejemplo.com"
            autoComplete="off"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Zona horaria *</Label>
        <Input
          id="timezone"
          placeholder="America/Panama"
          autoComplete="off"
          {...register("timezone")}
          aria-invalid={!!errors.timezone}
        />
        {errors.timezone && (
          <p className="text-xs text-destructive">{errors.timezone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          placeholder="Calle, ciudad, provincia..."
          rows={3}
          {...register("address")}
        />
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Cambios guardados correctamente.</p>
        </div>
      )}

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
    </form>
  )
}
