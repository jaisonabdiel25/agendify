import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, AtSign, Mail, MessageCircle, Phone, X } from "lucide-react"
import { LandingHeader } from "@/components/landing-header"

export const metadata: Metadata = {
  title: "Contáctanos — Agendify",
  description: "Estamos aquí para ayudarte. Escríbenos por el canal que prefieras.",
}

const channels = [
  {
    icon: Mail,
    label: "Correo electrónico",
    value: "hola@agendify.app",
    description: "Respondemos en menos de 24 horas.",
    href: "mailto:hola@agendify.app",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+57 300 000 0000",
    description: "Lunes a viernes, 9 am – 6 pm.",
    href: "https://wa.me/573000000000",
  },
  {
    icon: AtSign,
    label: "Instagram",
    value: "@agendify.app",
    description: "Síguenos para novedades y tips.",
    href: "https://instagram.com/agendify.app",
  },
  {
    icon: X,
    label: "Twitter / X",
    value: "@agendify",
    description: "Actualizaciones en tiempo real.",
    href: "https://twitter.com/agendify",
  },
  {
    icon: Phone,
    label: "Teléfono",
    value: "+57 601 000 0000",
    description: "Soporte directo para planes Pro.",
    href: "tel:+576010000000",
  },
]

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-16 pb-16 sm:pt-20 sm:pb-20">
        <span className="inline-block text-[0.6rem] sm:text-[0.65rem] tracking-[0.25em] uppercase text-muted-foreground mb-8 sm:mb-10 border border-border px-3 py-1.5 rounded-sm">
          Contáctanos
        </span>
        <h1 className="font-display font-light text-[clamp(2.4rem,7vw,6rem)] leading-[0.92] tracking-tight max-w-3xl">
          Estamos aquí<br className="hidden sm:block" /> para ayudarte.
        </h1>
        <div className="flex items-center gap-4 mt-8 sm:mt-10">
          <div className="hidden sm:block h-px w-10 bg-foreground/15" />
          <p className="text-muted-foreground text-sm sm:text-base max-w-xs sm:max-w-sm leading-relaxed">
            Escríbenos por el canal que prefieras y te responderemos a la brevedad.
          </p>
          <div className="hidden sm:block h-px w-10 bg-foreground/15" />
        </div>
      </section>

      {/* Channels */}
      <section className="border-t border-border px-5 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="divide-y divide-border">
            {channels.map(({ icon: Icon, label, value, description, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group py-6 sm:py-7 flex items-center gap-4 sm:gap-6 hover:bg-muted/20 -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-sm transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-foreground/25 transition-colors duration-200">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">
                    {label}
                  </p>
                  <p className="font-display font-light text-lg sm:text-xl leading-tight">
                    {value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border px-5 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/"
            className="font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity"
          >
            Agendify
          </Link>
          <span className="text-xs sm:text-sm">© 2026 Agendify. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
