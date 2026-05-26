import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { businessId, role } = session.user
  if (role !== "OWNER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  try {
    const [users, activeCount, business] = await Promise.all([
      prisma.user.findMany({
        where: { businessId, isDeleted: false },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          chair: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.count({ where: { businessId, isActive: true, isDeleted: false } }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { plan: { select: { maxUsers: true } } },
      }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        chairName: u.chair?.name ?? null,
      })),
      activeCount,
      maxUsers: business?.plan.maxUsers ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
