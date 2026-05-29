import type { Metadata } from "next"
import Link from "next/link"
import { Info } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { RegisterForm } from "@/components/modules/auth/register-form"

export const metadata: Metadata = {
  title: "Crear cuenta — Agendify",
}

const FEATURES = [
  "Activación con código de invitación",
  "Perfil listo en minutos",
  "Acceso completo al panel desde el día uno",
]

export default function RegisterPage() {
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
          className="relative z-10 font-bold text-base text-zinc-50 tracking-tight"
        >
          Agendify
        </Link>

        <div className="relative z-10">
          <p className="text-[0.65rem] tracking-[0.25em] uppercase text-zinc-500 mb-5">
            Plataforma de gestión
          </p>
          <h2 className="font-display font-light text-5xl lg:text-6xl leading-none text-zinc-50">
            Bienvenido<br />al equipo.
          </h2>
          <p className="mt-6 text-sm text-zinc-400 max-w-xs leading-relaxed">
            Usa el código de invitación para activar tu cuenta y empezar en minutos.
          </p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-zinc-500">
                <div className="h-px w-5 bg-zinc-700 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
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
                Crea tu<br />cuenta.
              </h1>
              <p className="text-sm text-muted-foreground mt-2.5">
                Usa tu código de invitación para crear tu cuenta
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-snug">
                  ¿No tienes un código?{" "}
                  <Link
                    href="/contactanos"
                    className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
                  >
                    Contáctanos
                  </Link>{" "}
                  para solicitar tu invitación.
                </p>
              </div>
            </div>

            <div className="animate-fade-up [animation-delay:100ms]">
              <RegisterForm />
            </div>

            <p className="animate-fade-up [animation-delay:180ms] text-sm text-muted-foreground mt-7">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-foreground font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
