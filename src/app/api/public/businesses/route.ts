import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 3) return NextResponse.json([])

  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      users: {
        where: { role: "OWNER", isDeleted: false },
        select: { name: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  })

  const result = businesses.map(({ users, ...b }) => ({
    ...b,
    ownerName: users[0]?.name ?? null,
  }))

  return NextResponse.json(result)
}
