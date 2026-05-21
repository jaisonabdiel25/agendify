import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  onlyMine: z.enum(["true", "false"]).optional(),
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
      service: { select: { id: true, name: true, color: true, durationMinutes: true } },
      chair: { select: { id: true, name: true } },
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
    service: b.service,
    chair: b.chair,
    customer: b.customer,
  }))

  return NextResponse.json(serialized)
}
