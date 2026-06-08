import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { email, code, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordResetToken: true, passwordResetExpires: true },
    })

    if (
      !user ||
      user.passwordResetToken !== code ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      return NextResponse.json({ error: "Código inválido o expirado." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
