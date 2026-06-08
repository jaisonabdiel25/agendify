import type { Metadata } from "next"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión — Agendify",
}

const APPOINTMENTS = [
  { time: "10:00", service: "Corte y barba", confirmed: true },
  { time: "12:30", service: "Coloración", confirmed: false },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>
}) {
  const params = await searchParams
  const verified = params.verified === "true"
  const reset = params.reset === "true"

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_480px]">
      {/* Left panel — always dark, branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Top-right ambient glow */}
        <div className="absolute -top-48 -right-48 w-130 h-130 rounded-full bg-zinc-600/20 blur-3xl pointer-events-none" />
        {/* Bottom-left subtle glow */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-zinc-800/40 blur-3xl pointer-events-none" />

        <Link
          href="/"
          className="animate-fade-in [animation-delay:0ms] relative z-10 font-bold text-base text-zinc-50 tracking-tight"
        >
          Agendify
        </Link>

        <div className="relative z-10">
          <p className="animate-fade-up [animation-delay:80ms] text-[0.65rem] tracking-[0.25em] uppercase text-zinc-500 mb-5">
            Plataforma de gestión
          </p>
          <h2 className="animate-fade-up [animation-delay:160ms] font-display font-light text-5xl lg:text-6xl leading-none text-zinc-50">
            Tu negocio,<br />organizado.
          </h2>
          <p className="animate-fade-up [animation-delay:240ms] mt-6 text-sm text-zinc-400 max-w-xs leading-relaxed">
            Reservas, equipo y clientes en un solo lugar. Sin fricciones.
          </p>

          {/* Mini app preview */}
          <div className="animate-fade-up [animation-delay:360ms] mt-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                  <span className="text-[0.6rem] font-medium text-zinc-400">Agenda · Hoy</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 text-zinc-900 text-[0.5rem] font-medium px-1.5 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-zinc-400" aria-hidden="true" />
                  3 citas
                </div>
              </div>
              <div className="p-2.5 space-y-1.5">
                {APPOINTMENTS.map((appt) => (
                  <div key={appt.time} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/60">
                    <span className="font-mono text-[0.55rem] text-zinc-500 w-8 shrink-0">{appt.time}</span>
                    <span className="text-[0.65rem] text-zinc-300 flex-1">{appt.service}</span>
                    <span
                      className={`text-[0.5rem] uppercase px-1 py-0.5 rounded-sm font-medium ${
                        appt.confirmed ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {appt.confirmed ? "Confirm." : "Pend."}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-700">© 2026 Agendify</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col min-h-dvh lg:min-h-0 border-l border-border">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-5">
          <Link
            href="/"
            className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity lg:hidden"
          >
            Agendify
          </Link>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-sm">
            <div className="animate-fade-up [animation-delay:0ms] mb-8 sm:mb-10">
              <h1 className="font-display font-light text-3xl sm:text-4xl leading-[1.05]">
                Bienvenido<br />de nuevo.
              </h1>
              <p className="text-sm text-muted-foreground mt-2.5">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {verified && (
              <div className="animate-fade-up mb-6 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800/40 dark:bg-green-900/20">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Cuenta verificada correctamente. Ya puedes iniciar sesión.
                </p>
              </div>
            )}

            {reset && (
              <div className="animate-fade-up mb-6 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800/40 dark:bg-green-900/20">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Contraseña actualizada correctamente. Ya puedes iniciar sesión.
                </p>
              </div>
            )}

            <div className="animate-fade-up [animation-delay:100ms]">
              <LoginForm />
            </div>

            <p className="animate-fade-up [animation-delay:180ms] text-sm text-muted-foreground mt-7">
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
