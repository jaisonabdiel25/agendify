import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "@/constant"

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

  const booking = await prisma.$transaction(async (tx) => {
    // Validate chair and service belong to the business
    const [chair, service] = await Promise.all([
      tx.chair.findFirst({ where: { id: chairId, businessId }, select: { id: true } }),
      tx.service.findFirst({ where: { id: serviceId, businessId }, select: { id: true, durationMinutes: true } }),
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

    return tx.booking.create({
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
  })

  return NextResponse.json(booking, { status: 201 })
}
