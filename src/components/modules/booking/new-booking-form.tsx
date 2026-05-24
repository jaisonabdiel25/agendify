"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "@/constant"

const schema = z.object({
  chairId: z.string().min(1, "Selecciona un puesto"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  date: z.string().min(1, "Selecciona una fecha"),
  time: z.string().min(1, "Selecciona una hora"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Chair {
  id: string
  name: string
  color: string
}

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: string
}

interface NewBookingFormProps {
  chairs: Chair[]
}

export function NewBookingForm({ chairs }: NewBookingFormProps) {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      chairId: "",
      serviceId: "",
      date: "",
      time: "",
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  })

  const chairId = useWatch({ control, name: "chairId" })
  const serviceId = useWatch({ control, name: "serviceId" })
  const date = useWatch({ control, name: "date" })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServices([])
    setValue("serviceId", "")
    setValue("time", "")
    setTimeSlots([])
    if (!chairId) return
    setLoadingServices(true)
    fetch(`/api/public/services?chairId=${chairId}`)
      .then((r) => r.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false))
  }, [chairId, setValue])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeSlots([])
    setValue("time", "")
    if (!chairId || !serviceId || !date) return
    setLoadingSlots(true)
    fetch(`/api/public/availability?chairId=${chairId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data: string[]) => setTimeSlots(data))
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [chairId, serviceId, date, setValue])

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((body as { error?: string }).error ?? "Error al crear la reserva")
      return
    }
    toast.success("Reserva creada correctamente")
    router.push("/booking")
    router.refresh()
  }

  const today = new Date().toISOString().split("T")[0]

  function formatTime(slot: string) {
    const [hStr, mStr] = slot.split(":")
    const h = parseInt(hStr)
    const m = mStr
    const period = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${m} ${period}`
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/booking"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </Link>
        <h1 className="font-display font-light text-3xl">Nueva reserva</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completa los datos para crear una reserva confirmada.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Puesto + Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="chairId">Puesto</Label>
            <Controller
              control={control}
              name="chairId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="chairId">
                    <SelectValue placeholder="Selecciona un puesto" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {chairs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.chairId && (
              <p className="text-xs text-destructive">{errors.chairId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="serviceId">Servicio</Label>
            <Controller
              control={control}
              name="serviceId"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!chairId || loadingServices}
                >
                  <SelectTrigger id="serviceId">
                    <SelectValue
                      placeholder={
                        loadingServices
                          ? "Cargando..."
                          : !chairId
                          ? "Selecciona un puesto primero"
                          : "Selecciona un servicio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.durationMinutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.serviceId && (
              <p className="text-xs text-destructive">{errors.serviceId.message}</p>
            )}
          </div>
        </div>

        {/* Fecha + Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              min={today}
              {...register("date")}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="time">Hora disponible</Label>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!chairId || !serviceId || !date || loadingSlots}
                >
                  <SelectTrigger id="time">
                    <SelectValue
                      placeholder={
                        loadingSlots
                          ? "Cargando horarios..."
                          : !chairId || !serviceId || !date
                          ? "Completa los campos anteriores"
                          : timeSlots.length === 0
                          ? "Sin horarios disponibles"
                          : "Selecciona una hora"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {formatTime(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.time && (
              <p className="text-xs text-destructive">{errors.time.message}</p>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="border-t border-border pt-6">
          <p className="text-sm font-medium mb-4">Datos del cliente</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" placeholder="Nombre completo" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" type="tel" placeholder="60000000" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="cliente@ejemplo.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Instrucciones especiales..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/booking">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear reserva
          </Button>
        </div>
      </form>
    </div>
  )
}
