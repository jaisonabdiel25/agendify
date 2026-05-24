"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, Loader2, Pencil, X, Copy, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PLAN_LIMITS } from "@/constant"
import type { PlanType } from "@prisma/client"

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

interface Invitation {
  id: string
  code: string
  createdAt: string
}

interface Plan {
  id: string
  name: string
  type: PlanType
}

interface BusinessCardProps {
  business: Business
  invitation: Invitation | null
  plan: Plan
  userCount: number
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? <span className="italic text-muted-foreground/50">—</span>}</p>
    </div>
  )
}

export function BusinessCard({ business, invitation: initialInvitation, plan, userCount }: BusinessCardProps) {
  const planLimits = PLAN_LIMITS[plan.type]
  const isAtUserLimit = planLimits.canInvite && userCount >= planLimits.maxUsers
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<Invitation | null>(initialInvitation)
  const [copied, setCopied] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
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

  function handleCancel() {
    reset()
    setServerError(null)
    setIsEditing(false)
  }

  async function onSubmit(data: FormValues) {
    setServerError(null)

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

    setIsEditing(false)
    router.refresh()
  }

  async function copyCode() {
    if (!invitation) return
    await navigator.clipboard.writeText(invitation.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function generateCode() {
    setGeneratingCode(true)
    const response = await fetch("/api/business/invitation", { method: "POST" })
    if (response.ok) {
      const data = await response.json()
      setInvitation(data)
    }
    setGeneratingCode(false)
  }

  return (
    <div className="space-y-6">
      {/* Business info card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-sm">Información del negocio</h2>
            <Badge variant={plan.type === "PRO" ? "default" : "secondary"} className="text-[0.65rem]">
              {plan.name}
            </Badge>
          </div>
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
                <InfoRow label="Nombre" value={business.name} />
              </div>
              <InfoRow label="Identificador (slug)" value={business.slug} />
              <InfoRow label="Zona horaria" value={business.timezone} />
              <InfoRow label="Teléfono" value={business.phone} />
              <InfoRow label="Correo electrónico" value={business.email} />
              <div className="sm:col-span-2">
                <InfoRow label="Dirección" value={business.address} />
              </div>
            </div>
          ) : (
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

      {/* Invitation card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-medium text-sm">Código de invitación</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {planLimits.canInvite
              ? "Comparte este código para que nuevos usuarios se registren en tu negocio."
              : "Tu plan Estándar no permite invitar usuarios adicionales."}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {planLimits.canInvite ? (
            <>
              {isAtUserLimit && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Tu plan Pro permite hasta {planLimits.maxUsers} usuarios. Ya se alcanzó el límite.
                  </p>
                </div>
              )}

              {invitation ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
                    <p className="font-mono font-medium tracking-widest text-lg">{invitation.code}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generado el {new Date(invitation.createdAt).toLocaleDateString("es-PA")}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" onClick={copyCode} title="Copiar código">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                !isAtUserLimit && (
                  <p className="text-sm text-muted-foreground">No hay código de invitación activo.</p>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={generateCode}
                disabled={generatingCode || isAtUserLimit}
              >
                {generatingCode ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                )}
                Generar nuevo código
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Actualiza tu plan para poder invitar colaboradores a tu negocio.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
