import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">
        Bienvenido, {session?.user?.name}. El dashboard está en construcción.
      </p>
    </div>
  )
}
