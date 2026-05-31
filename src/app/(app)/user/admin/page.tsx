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

  const maxUsers = business.plan.maxUsers
  const activeCount = users.filter((u) => u.isActive).length
  const usagePercent = Math.min((users.length / maxUsers) * 100, 100)

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
      <div className="w-full max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
          <div className="space-y-1">
            <h1 className="font-display font-light text-3xl">Equipo</h1>
            <p className="text-sm text-muted-foreground">
              Administra los usuarios de tu negocio y controla quién puede acceder.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:pt-1 shrink-0">
            <div className="flex h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {activeCount} activos · {users.length} / {maxUsers}
            </span>
          </div>
        </div>

        <StaffTable
          users={formattedUsers}
          totalCount={users.length}
          maxUsers={maxUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  )
}
