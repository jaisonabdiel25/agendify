import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { email, code } = parsed.data

    const user = await prisma.user.findFirst({
      where: { email, emailVerifyToken: code },
      select: { id: true, emailVerifyExpires: true, pendingBusinessId: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Código inválido." },
        { status: 400 }
      )
    }

    if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
      return NextResponse.json(
        { error: "El código ha expirado." },
        { status: 410 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        businessId: user.pendingBusinessId,
        pendingBusinessId: null,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
