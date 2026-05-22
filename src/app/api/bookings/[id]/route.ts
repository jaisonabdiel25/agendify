import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  paidAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { status, paidAmount } = parsed.data
  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status
  if (paidAmount !== undefined) {
    data.paidAmount = paidAmount !== null ? new Prisma.Decimal(paidAmount) : null
  }

  const result = await prisma.booking.updateMany({
    where: { id, businessId: session.user.businessId },
    data,
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const updated = await prisma.booking.findUnique({
    where: { id },
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
  })

  return NextResponse.json({
    id: updated!.id,
    startTime: updated!.startTime.toISOString(),
    endTime: updated!.endTime.toISOString(),
    status: updated!.status,
    notes: updated!.notes,
    paidAmount: updated!.paidAmount?.toString() ?? null,
    service: { ...updated!.service, price: updated!.service.price.toString() },
    chair: updated!.chair,
    customer: updated!.customer,
  })
}
