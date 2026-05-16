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
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <span className="animate-fade-in [animation-delay:0ms] inline-block text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-10 border border-border px-3 py-1.5">
          Versión Beta
        </span>

        <h1 className="animate-fade-up [animation-delay:80ms] font-display italic font-light text-[clamp(3rem,9vw,7rem)] leading-[0.92] tracking-tight max-w-4xl">
          Gestiona tu negocio sin complicaciones.
        </h1>

        <div className="animate-fade-up [animation-delay:180ms] flex items-center gap-4 my-10">
          <div className="h-px w-12 bg-foreground/20" />
          <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
            Centraliza tus reservas, equipo y clientes. Dedícate a lo que importa.
          </p>
          <div className="h-px w-12 bg-foreground/20" />
        </div>

        <div className="animate-fade-up [animation-delay:280ms] flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">
              Comenzar gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-14">
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Características
            </p>
            <h2 className="font-display italic font-light text-4xl sm:text-5xl leading-[1.05]">
              Todo lo que necesitas
            </h2>
          </div>

          <div className="divide-y divide-border">
            {features.map(({ number, icon: Icon, title, description }) => (
              <div
                key={title}
                className="group py-8 grid grid-cols-[2.5rem_3rem_1fr] gap-x-5 items-start hover:bg-muted/20 -mx-4 px-4 rounded-sm transition-colors duration-200"
              >
                <span className="font-mono text-[0.65rem] text-muted-foreground/50 pt-1.5 tracking-wider">
                  {number}
                </span>
                <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/25 transition-colors duration-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display italic font-normal text-xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
          <div>
            <h2 className="font-display italic font-light text-4xl sm:text-5xl leading-[1.05]">
              ¿Listo para empezar?
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Sin tarjeta de crédito · Cancela cuando quieras.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link href="/register">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-muted-foreground">
          <span className="font-bold text-foreground tracking-tight">Agendify</span>
          <span>© 2026 Agendify. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
