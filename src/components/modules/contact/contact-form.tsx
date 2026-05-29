"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "@/constant"

const schema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido."),
  phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(500, "El mensaje no puede superar los 500 caracteres."),
})

type FormValues = z.infer<typeof schema>

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      toast.error((body as { error?: string }).error ?? "No se pudo enviar el mensaje. Intenta de nuevo.")
      return
    }

    toast.success("Mensaje enviado. Te responderemos pronto.")
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-email" className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
            Correo electrónico
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            className="h-11"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Celular */}
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone" className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
            Número de celular
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="6XXXXXXX"
            autoComplete="tel"
            className="h-11"
            {...register("phone")}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Mensaje */}
      <div className="space-y-1.5">
        <Label htmlFor="contact-message" className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground">
          Descripción / Mensaje
        </Label>
        <Textarea
          id="contact-message"
          placeholder="Cuéntanos en qué podemos ayudarte..."
          rows={5}
          className="resize-none"
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full sm:w-auto h-11 px-8" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar mensaje"
        )}
      </Button>
    </form>
  )
}
