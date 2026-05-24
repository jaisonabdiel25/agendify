import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  onlyMine: z.enum(["true", "false"]).optional(),
})

const postSchema = z.object({
  chairId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    onlyMine: searchParams.get("onlyMine") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const { from, to, onlyMine } = parsed.data

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: session.user.businessId,
      startTime: { gte: new Date(from), lte: new Date(to) },
      status: { not: "CANCELLED" },
      ...(onlyMine === "true" ? { chair: { userId: session.user.id } } : {}),
    },
    include: {
      service: { select: { id: true, name: true, color: true, durationMinutes: true, price: true } },
      chair: {
        select: {
          id: true, name: true, color: true,
          user: { select: { id: true, name: true } },
        },
      },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { startTime: "asc" },
  })

  const serialized = bookings.map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    notes: b.notes,
    paidAmount: b.paidAmount?.toString() ?? null,
    service: { ...b.service, price: b.service.price.toString() },
    chair: b.chair,
    customer: b.customer,
  }))

  return NextResponse.json(serialized)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { chairId, serviceId, date, time, name, email, phone, notes } = parsed.data
  const businessId = session.user.businessId

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const [chair, service] = await Promise.all([
        tx.chair.findFirst({ where: { id: chairId, businessId }, select: { id: true } }),
        tx.service.findFirst({ where: { id: serviceId, businessId }, select: { id: true, durationMinutes: true } }),
      ])

      if (!chair) throw new Error("Puesto no válido")
      if (!service) throw new Error("Servicio no válido")

      const [year, month, day] = date.split("-").map(Number)
      const [hours, minutes] = time.split(":").map(Number)
      const startTime = new Date(year, month - 1, day, hours, minutes, 0)
      const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000)

      const conflict = await tx.booking.findFirst({
        where: {
          chairId,
          status: { not: "CANCELLED" },
          AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
      })
      if (conflict) throw new Error("El horario seleccionado ya no está disponible")

      let customer
      if (email) {
        customer = await tx.customer.upsert({
          where: { businessId_email: { businessId, email } },
          create: { businessId, name, email, phone: phone || null },
          update: {},
        })
      } else {
        customer = await tx.customer.create({
          data: { businessId, name, phone: phone || null },
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear la reserva"
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
