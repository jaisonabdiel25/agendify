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
    where: { id: "plan_standard_v1" },
    update: {
      type: "STANDARD",
      name: "Estándar",
      maxServices: 1,
      maxChairs: 1,
      maxUsers: 1,
      canInvite: false,
      statisticsCharts: ["status"],
    },
    create: {
      id: "plan_standard_v1",
      type: "STANDARD",
      name: "Estándar",
      maxServices: 1,
      maxChairs: 1,
      maxUsers: 1,
      canInvite: false,
      statisticsCharts: ["status"],
    },
  })

  await prisma.plan.upsert({
    where: { id: "plan_pro_v1" },
    update: {
      type: "PRO",
      name: "Pro",
      maxServices: 2,
      maxChairs: 3,
      maxUsers: 3,
      canInvite: true,
      statisticsCharts: ["*"],
    },
    create: {
      id: "plan_pro_v1",
      type: "PRO",
      name: "Pro",
      maxServices: 2,
      maxChairs: 3,
      maxUsers: 3,
      canInvite: true,
      statisticsCharts: ["*"],
    },
  })

  console.log("✓ Planes creados")

  // ── Negocio del sistema (para el usuario admin) ───────────────────────────────
  const systemBusiness = await prisma.business.upsert({
    where: { slug: "system" },
    update: {},
    create: {
      id: "business_system",
      name: "Sistema",
      slug: "system",
      planId: "plan_pro_v1",
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
