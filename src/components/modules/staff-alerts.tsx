"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { CalendarClock, UserX } from "lucide-react"

export const CHAIR_TOAST_ID = "staff-alert-no-chair"
export const SCHEDULE_TOAST_ID = "staff-alert-no-schedule"

interface StaffAlertsProps {
  hasChair: boolean
  hasSchedule: boolean
  role: string
}

export function StaffAlerts({ hasChair, hasSchedule, role }: StaffAlertsProps) {
  const pathname = usePathname()

  useEffect(() => {
    // setTimeout(0) en React Strict Mode: el cleanup sólo cancela el timer (sin
    // toast.dismiss), así el segundo ciclo muestra el toast sin el problema
    // dismiss→re-show-con-mismo-ID que Sonner ignora por la animación de salida.
    const timerId = setTimeout(() => {
      if (!hasChair && role === "STAFF") {
        toast.warning("Sin puesto asignado", {
          id: CHAIR_TOAST_ID,
          description:
            "No tienes un puesto asignado. Habla con tu administrador para que te asignen uno.",
          duration: Infinity,
          dismissible: false,
          icon: <UserX className="h-4 w-4" />,
        })
      } else {
        toast.dismiss(CHAIR_TOAST_ID)
      }

      if (hasChair && !hasSchedule && pathname !== "/schedule") {
        toast.warning("Sin horario configurado", {
          id: SCHEDULE_TOAST_ID,
          description: (
            <span>
              Tu puesto no tiene horarios configurados.{" "}
              <a href="/schedule" className="underline font-medium text-foreground">
                Configurar horario
              </a>
            </span>
          ),
          duration: Infinity,
          dismissible: false,
          icon: <CalendarClock className="h-4 w-4" />,
        })
      } else {
        toast.dismiss(SCHEDULE_TOAST_ID)
      }
    }, 0)

    // Solo cancela el timer pendiente. NO llama toast.dismiss para evitar que
    // las navegaciones normales rompan el ciclo show→dismiss→re-show.
    return () => clearTimeout(timerId)
  }, [hasChair, hasSchedule, role, pathname])

  // Descarta los toasts cuando el componente se desmonta (el usuario sale de
  // la sección (app), p.ej. al cerrar sesión). El efecto principal no puede
  // hacer esto porque su cleanup también corre en cada cambio de deps.
  useEffect(() => {
    return () => {
      toast.dismiss(CHAIR_TOAST_ID)
      toast.dismiss(SCHEDULE_TOAST_ID)
    }
  }, [])

  return null
}
