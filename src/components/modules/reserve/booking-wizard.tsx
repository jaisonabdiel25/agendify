"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Business {
  id: string
  name: string
  slug: string
  address: string | null
}

interface Chair {
  id: string
  name: string
  description: string | null
}

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: string
  color: string
}

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEPS = ["Negocio", "Puesto", "Servicio", "Fecha y hora", "Tus datos"]

// ─── Personal info schema ─────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
})
type ContactValues = z.infer<typeof contactSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`
}

function formatDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString("es-PA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function today() {
  return new Date().toISOString().split("T")[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="mb-6">
      {step > 1 && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
      )}
      <div className="flex gap-1 mb-3">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
              i < step ? "bg-foreground" : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className="text-[0.65rem] tracking-wider uppercase text-muted-foreground font-medium">
        {step} / {STEPS.length} — {STEPS[step - 1]}
      </p>
    </div>
  )
}

function SelectionCard({
  title,
  subtitle,
  accent,
  onClick,
}: {
  title: string
  subtitle?: string | null
  accent?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:border-foreground/25 hover:bg-muted/30 active:scale-[0.99] transition-all duration-150 p-4 group"
    >
      <div className="flex items-center gap-3">
        {accent && (
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rotate-180 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingWizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [chairs, setChairs] = useState<Chair[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<string[]>([])

  const [business, setBusiness] = useState<Business | null>(null)
  const [chair, setChair] = useState<Chair | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  // Fetch businesses on mount
  useEffect(() => {
    setLoading(true)
    fetch("/api/public/businesses")
      .then((r) => r.json())
      .then(setBusinesses)
      .finally(() => setLoading(false))
  }, [])

  // Fetch chairs when business changes
  useEffect(() => {
    if (!business) return
    setLoading(true)
    fetch(`/api/public/chairs?businessId=${business.id}`)
      .then((r) => r.json())
      .then(setChairs)
      .finally(() => setLoading(false))
  }, [business])

  // Fetch services when chair changes
  useEffect(() => {
    if (!chair) return
    setLoading(true)
    fetch(`/api/public/services?chairId=${chair.id}`)
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoading(false))
  }, [chair])

  // Fetch availability when date changes
  useEffect(() => {
    if (!chair || !service || !date) return
    setSlots([])
    setLoading(true)
    fetch(`/api/public/availability?chairId=${chair.id}&serviceId=${service.id}&date=${date}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [chair, service, date])

  function goBack() {
    setServerError(null)
    if (step === 2) { setChairs([]); setBusiness(null); setStep(1) }
    else if (step === 3) { setServices([]); setChair(null); setStep(2) }
    else if (step === 4) { setDate(""); setTime(""); setSlots([]); setService(null); setStep(3) }
    else if (step === 5) { setStep(4) }
  }

  async function onSubmit(data: ContactValues) {
    setServerError(null)
    const response = await fetch("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business!.id,
        chairId: chair!.id,
        serviceId: service!.id,
        date,
        time,
        ...data,
      }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al crear la reserva.")
      return
    }

    const booking = await response.json()
    setConfirmedBookingId(booking.id)
    setStep(6)
  }

  // ── Step 6: Success ──────────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <div className="w-full max-w-md text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-light text-3xl sm:text-4xl">¡Reserva confirmada!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Tu reserva en <strong className="text-foreground">{business?.name}</strong> con{" "}
            <strong className="text-foreground">{chair?.name}</strong> para{" "}
            <strong className="text-foreground">{service?.name}</strong> el{" "}
            <strong className="text-foreground">{date ? formatDate(date) : ""}</strong> a las{" "}
            <strong className="text-foreground">{time ? formatTime(time) : ""}</strong> ha sido recibida.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 inline-block">
          <p className="text-xs text-muted-foreground mb-0.5">Referencia</p>
          <p className="font-mono text-sm font-medium tracking-wide">{confirmedBookingId}</p>
        </div>
        <div className="pt-1">
          <Button
            variant="outline"
            onClick={() => {
              setBusiness(null); setChair(null); setService(null)
              setDate(""); setTime(""); setConfirmedBookingId(null)
              setStep(1)
            }}
          >
            Hacer otra reserva
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-display font-light text-3xl">Reservar cita</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige un negocio y agenda tu cita en minutos.
        </p>
      </div>

      {/* ── Step 1: Select business ── */}
      {step === 1 && (
        <div>
          <StepHeader step={1} onBack={goBack} />
          <h2 className="font-medium mb-4">¿En qué negocio deseas reservar?</h2>
          {loading ? (
            <LoadingState />
          ) : businesses.length === 0 ? (
            <EmptyState message="No hay negocios disponibles." />
          ) : (
            <div className="space-y-2">
              {businesses.map((b) => (
                <SelectionCard
                  key={b.id}
                  title={b.name}
                  subtitle={b.address}
                  onClick={() => { setBusiness(b); setStep(2) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select chair ── */}
      {step === 2 && (
        <div>
          <StepHeader step={2} onBack={goBack} />
          <h2 className="font-medium mb-4">¿Con quién deseas atenderte?</h2>
          {loading ? (
            <LoadingState />
          ) : chairs.length === 0 ? (
            <EmptyState message="No hay puestos disponibles en este negocio." />
          ) : (
            <div className="space-y-2">
              {chairs.map((c) => (
                <SelectionCard
                  key={c.id}
                  title={c.name}
                  subtitle={c.description}
                  onClick={() => { setChair(c); setStep(3) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Select service ── */}
      {step === 3 && (
        <div>
          <StepHeader step={3} onBack={goBack} />
          <h2 className="font-medium mb-4">¿Qué servicio deseas?</h2>
          {loading ? (
            <LoadingState />
          ) : services.length === 0 ? (
            <EmptyState message="Este puesto no tiene servicios disponibles." />
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <SelectionCard
                  key={s.id}
                  title={s.name}
                  subtitle={`${s.durationMinutes} min · $${Number(s.price).toFixed(2)}`}
                  accent={s.color}
                  onClick={() => { setService(s); setStep(4) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Select date + time ── */}
      {step === 4 && (
        <div>
          <StepHeader step={4} onBack={goBack} />
          <h2 className="font-medium mb-4">¿Cuándo deseas tu cita?</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Selecciona una fecha</Label>
              <Input
                id="date"
                type="date"
                min={today()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime("") }}
              />
            </div>

            {date && (
              <div className="space-y-1.5">
                <Label>Horarios disponibles</Label>
                {loading ? (
                  <LoadingState />
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay horarios disponibles para este día.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          time === slot
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground/40 hover:bg-muted/40"
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {time && (
              <Button className="w-full" onClick={() => setStep(5)}>
                Continuar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5: Personal info ── */}
      {step === 5 && (
        <div>
          <StepHeader step={5} onBack={goBack} />

          {/* Resumen */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6 space-y-1 text-sm">
            <p><span className="text-muted-foreground">Negocio:</span> {business?.name}</p>
            <p><span className="text-muted-foreground">Puesto:</span> {chair?.name}</p>
            <p><span className="text-muted-foreground">Servicio:</span> {service?.name}</p>
            <p>
              <span className="text-muted-foreground">Fecha:</span>{" "}
              {formatDate(date)} · {formatTime(time)}
            </p>
          </div>

          <h2 className="font-medium mb-4">Tus datos de contacto</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea id="notes" rows={2} placeholder="Algún detalle que quieras agregar..." {...register("notes")} />
            </div>

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando reserva...
                </>
              ) : (
                "Confirmar reserva"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
