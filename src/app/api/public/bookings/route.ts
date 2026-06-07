import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE, WEBHOOK_EVENT_NEW_BOOKING } from "@/constant"

const bookingSchema = z.object({
  businessId: z.string().min(1),
  chairId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { businessId, chairId, serviceId, date, time, name, email, phone, notes } = parsed.data

  const { booking, chair, service, business } = await prisma.$transaction(async (tx) => {
    const [chair, service] = await Promise.all([
      tx.chair.findFirst({
        where: { id: chairId, businessId },
        select: {
          id: true,
          name: true,
          user: { select: { name: true, email: true } },
        },
      }),
      tx.service.findFirst({
        where: { id: serviceId, businessId },
        select: { id: true, name: true, durationMinutes: true, price: true },
      }),
    ])

    if (!chair) throw new Error("Puesto no válido")
    if (!service) throw new Error("Servicio no válido")

    // Build startTime and endTime
    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    const startTime = new Date(year, month - 1, day, hours, minutes, 0)
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000)

    // Re-check availability to prevent double booking
    const conflict = await tx.booking.findFirst({
      where: {
        chairId,
        status: { not: "CANCELLED" },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    })
    if (conflict) throw new Error("El horario seleccionado ya no está disponible")

    // Upsert customer
    let customer
    if (email) {
      customer = await tx.customer.upsert({
        where: { businessId_email: { businessId, email } },
        create: { businessId, name, email, phone },
        update: { phone },
      })
    } else {
      const existing = await tx.customer.findFirst({
        where: { businessId, phone },
      })
      customer = existing ?? await tx.customer.create({
        data: { businessId, name, phone },
      })
    }

    const business = await tx.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    })

    const booking = await tx.booking.create({
      data: {
        businessId,
        chairId,
        serviceId,
        customerId: customer.id,
        startTime,
        endTime,
        notes: notes || null,
        status: "PENDING",
      },
      select: { id: true, startTime: true, endTime: true, status: true },
    })

    return { booking, chair, service, business }
  })

  const bookingWebhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL
  if (bookingWebhookUrl && chair.user?.email) {
    fetch(bookingWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: WEBHOOK_EVENT_NEW_BOOKING,
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          notes: notes ?? null,
        },
        staff: {
          name: chair.user.name,
          email: chair.user.email,
        },
        customer: {
          name,
          email: email || null,
          phone,
        },
        service: {
          name: service.name,
          durationMinutes: service.durationMinutes,
          price: service.price,
        },
        chair: { name: chair.name },
        business: { name: business?.name ?? "" },
      }),
    }).catch(() => {})
  }

  return NextResponse.json(booking, { status: 201 })
}
