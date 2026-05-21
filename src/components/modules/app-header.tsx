import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export async function AppHeader() {
  const session = await auth();
  const canManage =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <header className="border-b border-border px-6 py-4 shrink-0">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-base tracking-tight">
          Agendify
        </Link>
        <div className="flex items-center gap-3">
          {canManage && (
            <Link
              href="/chair"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Puestos
            </Link>
          )}
          {canManage && (
            <Link
              href="/service"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Servicios
            </Link>
          )}
          {canManage && (
            <Link
              href="/business"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Negocio
            </Link>
          )}
          <Link
            href="/booking"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reservas
          </Link>
          <Link
            href="/schedule"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cronograma
          </Link>
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session.user.name}
            </span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
