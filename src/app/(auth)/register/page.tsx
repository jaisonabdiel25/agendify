import type { Metadata } from "next"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { RegisterForm } from "@/components/modules/auth/register-form"

export const metadata: Metadata = {
  title: "Crear cuenta — Agendify",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_480px]">
      {/* Left panel — always dark, branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12">
        <Link href="/" className="font-bold text-base text-zinc-50 tracking-tight">
          Agendify
        </Link>

        <div>
          <p className="text-[0.65rem] tracking-[0.25em] uppercase text-zinc-500 mb-5">
            Plataforma de gestión
          </p>
          <h2 className="font-display font-light text-5xl lg:text-6xl leading-none text-zinc-50">
            Bienvenido<br />al equipo.
          </h2>
          <p className="mt-6 text-sm text-zinc-400 max-w-xs leading-relaxed">
            Usa el código que recibiste para activar tu cuenta.
          </p>
        </div>

        <p className="text-xs text-zinc-700">© 2026 Agendify</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col min-h-screen lg:min-h-0 border-l border-border">
        <div className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-5">
          <Link href="/" className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity lg:hidden">
            Agendify
          </Link>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 sm:mb-10">
              <h1 className="font-display font-light text-3xl sm:text-4xl leading-[1.05]">
                Crea tu<br />cuenta.
              </h1>
              <p className="text-sm text-muted-foreground mt-2.5">
                Usa tu código de invitación para crear tu cuenta
              </p>
            </div>

            <RegisterForm />

            <p className="text-sm text-muted-foreground mt-7">
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
