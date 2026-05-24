import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserProfileCard } from "@/components/modules/user/edit-user-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const roleLabel: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  STAFF: "Staff",
}

export default async function UserPage() {
  const session = await auth()

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, role: true, description: true, avatarUrl: true },
  })

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-2">
        <h1 className="font-display font-light text-3xl">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Información de tu cuenta y preferencias personales.
        </p>
      </div>

      <div className="w-full max-w-2xl mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-medium text-sm">Información de cuenta</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Estos datos no son editables.</p>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input value={user.email} disabled readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Input value={roleLabel[user.role] ?? user.role} disabled readOnly className="bg-muted/40" />
            </div>
          </div>
        </div>

        <UserProfileCard user={{ id: user.id, name: user.name, description: user.description }} />
      </div>
    </div>
  )
}
