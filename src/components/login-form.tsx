"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getSession, signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2, AlertCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep] = useState<"login" | "verify">("login")
  const [pendingEmail, setPendingEmail] = useState("")
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

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.code === "inactive_business") {
      setServerError("Tu negocio no está activo. Contacta al administrador para activarlo.")
      return
    }

    if (result?.code === "inactive_user") {
      setPendingEmail(data.email)
      setStep("verify")
      return
    }

    if (result?.error) {
      setServerError("Credenciales incorrectas. Intenta de nuevo.")
      return
    }

    const session = await getSession()
    router.push(session?.user?.role === "ADMIN" ? "/admin" : "/dashboard")
    router.refresh()
  }

  async function handleVerify() {
    setVerifying(true)
    setVerifyError("")

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, code: verifyCode }),
    })

    if (res.ok) {
      setStep("login")
      setVerifyCode("")
      setVerifyError("")
      setResendMessage("")
      router.replace("/login?verified=true")
    } else {
      const data = await res.json().catch(() => ({}))
      setVerifyError(data.error ?? "Código incorrecto.")
      setVerifying(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResendMessage("")
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    }).catch(() => {})
    setResendMessage("Te enviamos un nuevo código.")
    setResending(false)
  }

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Verifica tu correo electrónico
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Enviamos un código de 6 dígitos a{" "}
            <span className="font-medium text-foreground">{pendingEmail}</span>
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
              onClick={() => setStep("login")}
            >
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <button
            type="button"
            tabIndex={-1}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
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
            Ingresando...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  )
}
