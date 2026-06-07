import Link from "next/link"
import { ArrowRight, BarChart3, Calendar, Check, Clock, Shield, Users, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing-header"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { prisma } from "@/lib/prisma"

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

const heroBenefits = [
  { icon: Zap, label: "Configuración en minutos" },
  { icon: Shield, label: "Datos seguros y privados" },
  { icon: Clock, label: "Cancela cuando quieras" },
]

const businessTypes = [
  "Barberías",
  "Salones de belleza",
  "Spas y wellness",
  "Clínicas estéticas",
  "Estudios de tatuaje",
  "Centros de masajes",
  "Peluquerías",
  "Nail studios",
  "Centros de fitness",
  "Consultorios",
]

type PlanData = {
  id: string
  type: string
  name: string
  maxServices: number
  maxChairs: number
  maxUsers: number
  canInvite: boolean
  statisticsCharts: string[]
}

function getPlanFeatures(plan: PlanData) {
  const statsLabel = plan.statisticsCharts.includes("*")
    ? "Estadísticas completas"
    : "Estadísticas de estado de reservas"
  return [
    {
      label: `${plan.maxServices} servicio${plan.maxServices !== 1 ? "s" : ""} activo${plan.maxServices !== 1 ? "s" : ""}`,
      included: true,
    },
    {
      label: `${plan.maxChairs} puesto${plan.maxChairs !== 1 ? "s" : ""} activo${plan.maxChairs !== 1 ? "s" : ""}`,
      included: true,
    },
    {
      label: `Hasta ${plan.maxUsers} usuario${plan.maxUsers !== 1 ? "s" : ""}`,
      included: true,
    },
    { label: "Invitaciones al equipo", included: plan.canInvite },
    { label: statsLabel, included: true },
  ]
}

export default async function HomePage() {
  const plans: PlanData[] = await prisma.plan.findMany({
    select: {
      id: true,
      type: true,
      name: true,
      maxServices: true,
      maxChairs: true,
      maxUsers: true,
      canInvite: true,
      statisticsCharts: true,
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-5 sm:px-6 pt-20 pb-10 sm:pt-28 sm:pb-14 overflow-hidden">
        {/* Dot grid background */}
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none" aria-hidden="true" />
        {/* Gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-b from-transparent to-background pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative w-full max-w-4xl">
          <span className="animate-fade-in [animation-delay:0ms] inline-block text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-8 sm:mb-10 border border-border px-3 py-1.5 rounded-sm">
            Versión Beta
          </span>

          <h1 className="animate-fade-up [animation-delay:80ms] font-display font-light text-[clamp(2.8rem,8vw,7rem)] leading-[0.92] tracking-tight max-w-4xl mx-auto">
            Tu agenda,<br />
            sin complicaciones.
          </h1>

          <div className="animate-fade-up [animation-delay:180ms] flex items-center justify-center gap-4 my-8 sm:my-10">
            <div className="hidden sm:block h-px w-10 bg-foreground/15" />
            <p className="text-muted-foreground text-sm sm:text-base max-w-sm leading-relaxed text-center sm:text-left">
              Centraliza reservas, equipo y clientes en un solo lugar.
              Dedícate a lo que realmente importa.
            </p>
            <div className="hidden sm:block h-px w-10 bg-foreground/15" />
          </div>

          <div className="animate-fade-up [animation-delay:280ms] flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/register">
                Comenzar ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>

          {/* Benefits strip */}
          <div className="animate-fade-up [animation-delay:360ms] flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-5">
            {heroBenefits.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>

          <div className="animate-fade-up [animation-delay:420ms] mt-4">
            <Link
              href="/reserve"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-150"
            >
              ¿Solo quieres reservar una cita? →
            </Link>
          </div>
        </div>

        {/* Product preview */}
        <div className="animate-fade-up [animation-delay:500ms] relative mt-12 sm:mt-16 w-full max-w-lg mx-auto">
          <div className="animate-float rounded-2xl rounded-b-none border border-b-0 border-border bg-card shadow-xl overflow-hidden text-left" style={{ animationDelay: "900ms" }}>
            {/* App header bar */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-medium">Agenda · Miércoles 28</span>
              </div>
              <div className="flex items-center gap-1.5 bg-foreground text-background text-[0.55rem] font-medium px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-background/70" aria-hidden="true" />
                Nueva reserva
              </div>
            </div>

            {/* Appointment rows */}
            <div className="p-3 space-y-1.5">
              {[
                { time: "10:00", service: "Corte y barba", client: "Carlos M.", confirmed: true },
                { time: "11:30", service: "Coloración premium", client: "Ana Rodríguez", confirmed: true },
                { time: "14:00", service: "Manicure + Pedicure", client: "Sofía L.", confirmed: false },
              ].map((appt) => (
                <div key={appt.time} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                  <span className="font-mono text-[0.65rem] text-muted-foreground w-9 shrink-0">{appt.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{appt.service}</p>
                    <p className="text-[0.65rem] text-muted-foreground leading-tight mt-0.5">{appt.client}</p>
                  </div>
                  <span
                    className={`text-[0.55rem] tracking-wider uppercase px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${
                      appt.confirmed
                        ? "bg-foreground/10 text-foreground/70"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {appt.confirmed ? "Confirmada" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>

            {/* Card footer */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-[0.65rem] text-muted-foreground">4 citas programadas mañana</span>
              <span className="text-[0.65rem] text-foreground/60 font-medium">↑ 28% esta semana</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="border-y border-border px-5 sm:px-6 py-6 sm:py-8 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <AnimateOnScroll
            staggerChildren
            staggerDelay={80}
            threshold={0.3}
            className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border text-center"
          >
            {[
              { value: "2 min", label: "Para configurar tu negocio" },
              { value: "∞", label: "Reservas sin límite" },
              { value: "24/7", label: "Disponible para tus clientes" },
            ].map(({ value, label }) => (
              <div key={label} className="py-5 sm:py-3 sm:px-8">
                <p className="font-display font-light text-3xl sm:text-4xl">{value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
              </div>
            ))}
          </AnimateOnScroll>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <AnimateOnScroll animation="slide-up" className="mb-10 sm:mb-16">
            <p className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-3 sm:mb-4">
              Características
            </p>
            <h2 className="font-display font-light text-3xl sm:text-5xl leading-[1.05]">
              Todo lo que necesitas
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll
            staggerChildren
            staggerDelay={80}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
          >
            {features.map(({ number, icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-xl border border-border hover:border-foreground/20 transition-all duration-200 hover:shadow-sm flex flex-col gap-5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center group-hover:border-foreground/25 transition-colors duration-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-[0.65rem] text-muted-foreground/40 tracking-wider">
                    {number}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-light text-xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </AnimateOnScroll>
        </div>
      </section>

      {/* Ideal para */}
      <section className="border-b border-border px-5 sm:px-6 py-12 sm:py-16">
        <AnimateOnScroll animation="slide-up" className="max-w-4xl mx-auto">
          <p className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-6 sm:mb-8">
            Ideal para
          </p>
          <AnimateOnScroll
            staggerChildren
            staggerDelay={40}
            threshold={0.1}
            className="flex flex-wrap gap-2.5"
          >
            {businessTypes.map((type) => (
              <span
                key={type}
                className="text-sm px-4 py-1.5 rounded-full border border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground transition-all duration-150 cursor-default"
              >
                {type}
              </span>
            ))}
          </AnimateOnScroll>
        </AnimateOnScroll>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <AnimateOnScroll animation="slide-up" className="mb-10 sm:mb-14">
            <p className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-3 sm:mb-4">
              Precios
            </p>
            <h2 className="font-display font-light text-3xl sm:text-5xl leading-[1.05]">
              Simple y transparente
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll
            staggerChildren
            staggerDelay={100}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start"
          >
            {plans.map((plan) => {
              const isPro = plan.type === "PRO"
              const planFeatures = getPlanFeatures(plan)

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 sm:p-8 flex flex-col gap-6 transition-shadow duration-200 ${
                    isPro
                      ? "border-foreground/25 bg-foreground/2 shadow-sm"
                      : "border-border"
                  }`}
                >
                  {isPro && (
                    <span className="absolute top-5 right-5 text-[0.6rem] tracking-[0.2em] uppercase bg-foreground text-background px-2 py-0.5 rounded-sm font-medium">
                      Popular
                    </span>
                  )}

                  <div>
                    <h3 className="font-display font-light text-xl sm:text-2xl">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isPro
                        ? "Para equipos que quieren crecer."
                        : "La forma perfecta de empezar."}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2.5 flex-1">
                    {planFeatures.map(({ label, included }) => (
                      <li key={label} className="flex items-start gap-2.5 text-sm">
                        {included ? (
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className={included ? "" : "text-muted-foreground/40"}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={isPro ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href="/register">
                      {isPro ? "Comenzar con Pro" : "Comenzar con Estándar"}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border px-5 sm:px-6 py-20 sm:py-32">
        <AnimateOnScroll animation="slide-up" threshold={0.2} className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-light text-4xl sm:text-6xl leading-none">
            ¿Listo para ordenar<br className="hidden sm:block" /> tu agenda?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-5 mb-8 max-w-sm mx-auto">
            Crea tu cuenta y empieza a gestionar tu agenda hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Crear una cuenta <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/reserve">Reservar una cita</Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-5 sm:px-6 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between gap-8">
            <div>
              <span className="font-bold text-foreground tracking-tight">Agendify</span>
              <p className="text-xs text-muted-foreground mt-2 max-w-50 leading-relaxed">
                La plataforma de gestión de citas para negocios de servicio.
              </p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground sm:justify-end">
              <Link href="/#features" className="hover:text-foreground transition-colors">Características</Link>
              <Link href="/#pricing" className="hover:text-foreground transition-colors">Precios</Link>
              <Link href="/reserve" className="hover:text-foreground transition-colors">Reservar cita</Link>
              <Link href="/contactanos" className="hover:text-foreground transition-colors">Contacto</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
            </nav>
          </div>
          <div className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs text-muted-foreground">© 2026 Agendify. Todos los derechos reservados.</span>
            <span className="text-xs text-muted-foreground">Hecho con cuidado</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
