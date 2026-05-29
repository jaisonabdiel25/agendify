"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  businessId: z.string().min(1, "Selecciona un negocio"),
})

type FormValues = z.infer<typeof schema>

interface Business {
  id: string
  name: string
  canInvite: boolean | null
  maxUsers: number | null
  userCount: number
}

export function CreateInvitationForm({ businesses }: { businesses: Business[] }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const selectedBusinessId = watch("businessId")
  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId)

  const inviteBlockedMessage = (() => {
    if (!selectedBusiness) return null
    if (selectedBusiness.canInvite === null) return "Este negocio no tiene un plan asignado."
    if (!selectedBusiness.canInvite) return "El plan Estándar no permite generar invitaciones."
    if (selectedBusiness.maxUsers !== null && selectedBusiness.userCount >= selectedBusiness.maxUsers)
      return `El plan Pro permite hasta ${selectedBusiness.maxUsers} usuarios. Ya se alcanzó el límite.`
    return null
  })()

  async function onSubmit(data: FormValues) {
    setServerError(null)
    setGeneratedCode(null)

    const response = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al generar la invitación.")
      return
    }

    const invitation = await response.json()
    setGeneratedCode(invitation.code)
    reset()
    router.refresh()
  }

  async function copyCode() {
    if (!generatedCode) return
    await navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invitationBusinessId">Negocio</Label>
        <Select
          value={selectedBusinessId ?? ""}
          onValueChange={(val) => setValue("businessId", val, { shouldValidate: true })}
        >
          <SelectTrigger
            id="invitationBusinessId"
            aria-invalid={!!errors.businessId}
          >
            <SelectValue placeholder="Selecciona un negocio..." />
          </SelectTrigger>
          <SelectContent position="popper">
            {businesses.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.businessId && (
          <p className="text-xs text-destructive">{errors.businessId.message}</p>
        )}
      </div>

      {inviteBlockedMessage && (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-600 dark:text-amber-400">{inviteBlockedMessage}</p>
        </div>
      )}

      {serverError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {generatedCode && (
        <div role="alert" className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Código generado</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xl font-semibold tracking-widest text-emerald-600 dark:text-emerald-400">
              {generatedCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Copiar código"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || businesses.length === 0 || !!inviteBlockedMessage}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          "Generar invitación"
        )}
      </Button>

      {businesses.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Crea un negocio primero para generar invitaciones.
        </p>
      )}
    </form>
  )
}
