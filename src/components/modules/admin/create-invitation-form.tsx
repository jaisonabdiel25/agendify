"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const schema = z.object({
  businessId: z.string().min(1, "Selecciona un negocio"),
})

type FormValues = z.infer<typeof schema>

interface Business {
  id: string
  name: string
}

export function CreateInvitationForm({ businesses }: { businesses: Business[] }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

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
        <Label htmlFor="businessId">Negocio</Label>
        <select
          id="businessId"
          {...register("businessId")}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un negocio...</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {errors.businessId && (
          <p className="text-xs text-destructive">{errors.businessId.message}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {generatedCode && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Código generado</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xl font-semibold tracking-widest text-emerald-600 dark:text-emerald-400">
              {generatedCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="text-muted-foreground hover:text-foreground transition-colors"
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
        disabled={isSubmitting || businesses.length === 0}
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
