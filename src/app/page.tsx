import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, Check, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Gestiona citas y disponibilidad en tiempo real. Tus clientes reservan cuando quieren, tú confirmas al instante.",
  },
  {
    icon: Users,
    title: "Gestión de equipo",
    description:
      "Administra múltiples colaboradores, asigna servicios y controla los horarios desde un solo panel.",
  },
  {
    icon: BarChart3,
    title: "Panel de control",
    description:
      "Visualiza reservas, ingresos y métricas clave. Toma decisiones informadas para hacer crecer tu negocio.",
  },
]

const perks = ["Sin límite de citas", "Soporte incluido", "Cancela cuando quieras"]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 lg:py-36">
        <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1">
          Versión Beta
        </Badge>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl leading-[1.05]">
          Gestiona tu negocio.{" "}
          <span className="text-muted-foreground">Sin complicaciones.</span>
        </h1>
        <p className="mt-6 text-muted-foreground text-lg max-w-lg leading-relaxed">
          Agendify centraliza tus reservas, equipo y clientes en un solo lugar.
          Dedícate a lo que importa — nosotros nos encargamos del resto.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas</h2>
            <p className="mt-3 text-muted-foreground">
              Herramientas diseñadas para negocios de servicios que quieren escalar.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight">¿Listo para empezar?</h2>
          <p className="mt-4 text-muted-foreground">
            Crea tu cuenta en minutos. Sin tarjeta de crédito.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-muted-foreground">
            {perks.map((perk) => (
              <span key={perk} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {perk}
              </span>
            ))}
          </div>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground text-base">Agendify</span>
          <span>© 2026 Agendify. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
