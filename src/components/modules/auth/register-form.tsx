"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z
  .object({
    invitationCode: z.string().min(1, "Ingresa el código de invitación"),
    name: z.string().min(2, "Tu nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep] = useState<"form" | "verify">("form")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setServerError(null)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitationCode: data.invitationCode,
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al crear la cuenta. Intenta de nuevo.")
      return
    }

    setVerifyEmail(data.email)
    setStep("verify")
  }

  async function handleResend() {
    setResending(true)
    setResendMessage("")
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verifyEmail }),
    }).catch(() => {})
    setResendMessage("Te enviamos un nuevo código.")
    setResending(false)
  }

  async function handleVerify() {
    setVerifying(true)
    setVerifyError("")

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verifyEmail, code: verifyCode }),
    })

    if (res.ok) {
      router.push("/login?verified=true")
    } else {
      const data = await res.json().catch(() => ({}))
      setVerifyError(data.error ?? "Código incorrecto.")
      setVerifying(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Ingresa el código de verificación
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Enviamos un código de 6 dígitos a{" "}
            <span className="font-medium text-foreground">{verifyEmail}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verifyCode">Código de verificación</Label>
          <Input
            id="verifyCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]*"
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            className="h-14 text-center text-2xl font-mono tracking-[0.5em]"
            autoComplete="one-time-code"
          />
        </div>

        {verifyError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{verifyError}</p>
          </div>
        )}

        <Button
          type="button"
          className="w-full h-11"
          disabled={verifying || verifyCode.length < 6}
          onClick={handleVerify}
        >
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar código"
          )}
        </Button>

        <div className="space-y-2 text-center">
          {resendMessage && (
            <p className="text-xs text-green-600 dark:text-green-400">{resendMessage}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ¿No lo recibiste?{" "}
            <button
              type="button"
              disabled={resending}
              className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity disabled:opacity-50"
              onClick={handleResend}
            >
              {resending ? "Enviando..." : "Reenviar código"}
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            <button
              type="button"
              className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
              onClick={() => setStep("form")}
            >
              Volver al formulario
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Código de invitación */}
      <div className="space-y-1.5">
        <Label htmlFor="invitationCode">Código de invitación</Label>
        <Input
          id="invitationCode"
          type="text"
          placeholder="XXXX-XXXX"
          autoComplete="off"
          className="h-11 font-mono tracking-widest"
          {...register("invitationCode")}
          aria-invalid={!!errors.invitationCode}
        />
        {errors.invitationCode && (
          <p className="text-xs text-destructive">{errors.invitationCode.message}</p>
        )}
      </div>

      {/* Separador de sección */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-start">
          <span className="bg-background pr-3 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            Tus datos
          </span>
        </div>
      </div>

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Tu nombre</Label>
        <Input
          id="name"
          type="text"
          placeholder="Juan Pérez"
          autoComplete="name"
          className="h-11"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@empresa.com"
          autoComplete="email"
          className="h-11"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className="h-11 pr-10"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            className="h-11 pr-10"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>
    </form>
  )
}
