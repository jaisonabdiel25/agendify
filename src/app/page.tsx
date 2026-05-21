import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"

const features = [
  {
    number: "01",
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Gestiona citas y disponibilidad en tiempo real. Tus clientes reservan cuando quieren, tú confirmas al instante.",
  },
  {
    number: "02",
    icon: Users,
    title: "Gestión de equipo",
    description:
      "Administra múltiples colaboradores, asigna servicios y controla los horarios desde un solo panel.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Panel de control",
    description:
      "Visualiza reservas, ingresos y métricas clave. Toma decisiones informadas para hacer crecer tu negocio.",
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-16 pb-28 sm:pt-20 sm:pb-32">
        <span className="animate-fade-in [animation-delay:0ms] inline-block text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-8 sm:mb-10 border border-border px-3 py-1.5 rounded-sm">
          Versión Beta
        </span>

        <h1 className="animate-fade-up [animation-delay:80ms] font-display font-light text-[clamp(2.6rem,8vw,7rem)] leading-[0.92] tracking-tight max-w-4xl">
          Gestiona tu negocio<br className="hidden sm:block" /> sin complicaciones.
        </h1>

        <div className="animate-fade-up [animation-delay:180ms] flex items-center gap-4 my-8 sm:my-10">
          <div className="hidden sm:block h-px w-10 bg-foreground/15" />
          <p className="text-muted-foreground text-sm sm:text-base max-w-xs sm:max-w-sm leading-relaxed">
            Centraliza tus reservas, equipo y clientes. Dedícate a lo que importa.
          </p>
          <div className="hidden sm:block h-px w-10 bg-foreground/15" />
        </div>

        <div className="animate-fade-up [animation-delay:280ms] flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/register">
              Comenzar gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
        <div className="animate-fade-up [animation-delay:360ms] mt-4">
          <Link
            href="/reserve"
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-150"
          >
            ¿Solo quieres reservar una cita? →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-3 sm:mb-4">
              Características
            </p>
            <h2 className="font-display font-light text-3xl sm:text-5xl leading-[1.05]">
              Todo lo que necesitas
            </h2>
          </div>

          <div className="divide-y divide-border">
            {features.map(({ number, icon: Icon, title, description }) => (
              <div
                key={title}
                className="group py-6 sm:py-8 flex gap-4 sm:grid sm:grid-cols-[2.5rem_3rem_1fr] sm:gap-x-5 items-start hover:bg-muted/20 -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-sm transition-colors duration-200"
              >
                <span className="hidden sm:block font-mono text-[0.65rem] text-muted-foreground/50 pt-1.5 tracking-wider">
                  {number}
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/25 transition-colors duration-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5 sm:mb-2">
                    <h3 className="font-display font-light text-lg sm:text-xl">{title}</h3>
                    <span className="sm:hidden font-mono text-[0.6rem] text-muted-foreground/40 tracking-wider">{number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 sm:gap-10">
          <div>
            <h2 className="font-display font-light text-3xl sm:text-5xl leading-[1.05]">
              ¿Listo para empezar?
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Sin tarjeta de crédito · Cancela cuando quieras.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0 w-full sm:w-auto">
            <Link href="/register">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-5 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <span className="font-bold text-foreground tracking-tight">Agendify</span>
          <span className="text-xs sm:text-sm">© 2026 Agendify. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
