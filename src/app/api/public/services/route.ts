import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chairId = searchParams.get("chairId")

  if (!chairId) {
    return NextResponse.json({ error: "chairId requerido" }, { status: 400 })
  }

  const links = await prisma.chairService.findMany({
    where: { chairId },
    include: {
      service: {
        select: { id: true, name: true, durationMinutes: true, price: true, color: true, isActive: true },
      },
    },
  })

  const services = links
    .filter((l) => l.service.isActive)
    .map((l) => ({
      id: l.service.id,
      name: l.service.name,
      durationMinutes: l.service.durationMinutes,
      price: l.service.price,
      color: l.service.color,
    }))

  return NextResponse.json(services)
}
