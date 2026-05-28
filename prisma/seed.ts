import * as dotenv from "dotenv"
dotenv.config()

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Planes ────────────────────────────────────────────────────────────────────
  await prisma.plan.upsert({
    where: { id: "da734ae5-cbc0-49af-a2d3-b272095c55c9" },
    update: {
      type: "STANDARD",
      name: "Estándar",
      maxServices: 1,
      maxChairs: 1,
      maxUsers: 1,
      canInvite: false,
      statisticsCharts: ["status"],
      price: 0,
      discount: null,
    },
    create: {
      id: "da734ae5-cbc0-49af-a2d3-b272095c55c9",
      type: "STANDARD",
      name: "Estándar",
      maxServices: 1,
      maxChairs: 1,
      maxUsers: 1,
      canInvite: false,
      statisticsCharts: ["status"],
      price: 6.99,
      discount: 0,
    },
  })

  await prisma.plan.upsert({
    where: { id: "b8c9d0e1-f2g3-h4i5-j6k7-l8m9n0o1p2q3" },
    update: {
      type: "PRO",
      name: "Pro",
      maxServices: 2,
      maxChairs: 3,
      maxUsers: 3,
      canInvite: true,
      statisticsCharts: ["*"],
      price: 9.99,
      discount: 0,
    },
    create: {
      id: "b8c9d0e1-f2g3-h4i5-j6k7-l8m9n0o1p2q3",
      type: "PRO",
      name: "Pro",
      maxServices: 2,
      maxChairs: 3,
      maxUsers: 3,
      canInvite: true,
      statisticsCharts: ["*"],
      price: 29.99,
      discount: null,
    },
  })

  console.log("✓ Planes creados")

  // ── Negocio del sistema (para el usuario admin) ───────────────────────────────
  const systemBusiness = await prisma.business.upsert({
    where: { slug: "system" },
    update: {},
    create: {
      id: "5b0693da-f048-46fb-9f89-b13e11ada418",
      name: "Sistema",
      slug: "system",
      planId: "da734ae5-cbc0-49af-a2d3-b272095c55c9",
    },
  })

  console.log("✓ Negocio del sistema creado")

  // ── Usuario admin ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@agendify.com"
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!"
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      businessId: systemBusiness.id,
    },
  })

  console.log(`✓ Usuario admin creado: ${adminEmail} / ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
