import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { StaffTable } from "@/components/modules/admin/staff-table"

export default async function UserAdminPage() {
  const session = await auth()

  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { businessId, id: currentUserId, role: currentUserRole } = session.user

  const [users, business] = await Promise.all([
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
    prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { plan: { select: { maxUsers: true } } },
    }),
  ])

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    chairName: u.chair?.name ?? null,
  }))

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-2">
        <h1 className="font-display font-light text-3xl">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Administra los usuarios de tu negocio y controla quién puede acceder.
        </p>
      </div>

      <div className="w-full max-w-3xl mt-8">
        <StaffTable
          users={formattedUsers}
          totalCount={users.length}
          maxUsers={business.plan.maxUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  )
}
