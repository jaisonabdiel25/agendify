import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get("businessId")

  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 })
  }

  const chairs = await prisma.chair.findMany({
    where: { businessId, isActive: true, NOT: { userId: null } },
    select: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      user: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(chairs)
}
