/**
 * @jest-environment jsdom
 */

jest.mock("sonner", () => ({
  toast: {
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}))

jest.mock("lucide-react", () => ({
  UserX: () => null,
  CalendarClock: () => null,
}))

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
}))

import React from "react"
import { render, waitFor } from "@testing-library/react"
import { StaffAlerts, CHAIR_TOAST_ID, SCHEDULE_TOAST_ID } from "@/components/modules/staff-alerts"
import { toast } from "sonner"
import { usePathname } from "next/navigation"

const mockUsePathname = usePathname as jest.Mock

beforeEach(() => {
  mockUsePathname.mockReturnValue("/dashboard")
  jest.clearAllMocks()
})

describe("StaffAlerts", () => {
  it("no dispara ningún toast cuando el usuario tiene puesto y horario", async () => {
    render(<StaffAlerts hasChair={true} hasSchedule={true} role="STAFF" />)
    await new Promise((r) => setTimeout(r, 20))
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it("dispara alerta de puesto no asignado cuando hasChair es false y rol es STAFF", async () => {
    render(<StaffAlerts hasChair={false} hasSchedule={false} role="STAFF" />)
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        "Sin puesto asignado",
        expect.objectContaining({ id: CHAIR_TOAST_ID, duration: Infinity, dismissible: false })
      )
    })
  })

  it("no dispara alerta de puesto cuando el rol no es STAFF", async () => {
    render(<StaffAlerts hasChair={false} hasSchedule={false} role="OWNER" />)
    await new Promise((r) => setTimeout(r, 20))
    const titles = (toast.warning as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    expect(titles).not.toContain("Sin puesto asignado")
  })

  it("dispara alerta de horario cuando tiene puesto pero no horario", async () => {
    render(<StaffAlerts hasChair={true} hasSchedule={false} role="OWNER" />)
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        "Sin horario configurado",
        expect.objectContaining({ id: SCHEDULE_TOAST_ID, duration: Infinity, dismissible: false })
      )
    })
  })

  it("no dispara alerta de horario cuando no tiene puesto", async () => {
    render(<StaffAlerts hasChair={false} hasSchedule={false} role="STAFF" />)
    await new Promise((r) => setTimeout(r, 20))
    const titles = (toast.warning as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    expect(titles).not.toContain("Sin horario configurado")
  })

  it("no dispara alerta de horario cuando el usuario está en /schedule", async () => {
    mockUsePathname.mockReturnValue("/schedule")
    render(<StaffAlerts hasChair={true} hasSchedule={false} role="OWNER" />)
    await new Promise((r) => setTimeout(r, 20))
    const titles = (toast.warning as jest.Mock).mock.calls.map((c: unknown[]) => c[0])
    expect(titles).not.toContain("Sin horario configurado")
  })

  it("descarta el toast de horario al entrar a /schedule", async () => {
    mockUsePathname.mockReturnValue("/schedule")
    render(<StaffAlerts hasChair={true} hasSchedule={false} role="OWNER" />)
    await new Promise((r) => setTimeout(r, 20))
    expect(toast.dismiss).toHaveBeenCalledWith(SCHEDULE_TOAST_ID)
  })

  it("descarta los toasts al desmontar el componente (salida de la sección app)", async () => {
    const { unmount } = render(<StaffAlerts hasChair={false} hasSchedule={false} role="STAFF" />)
    await waitFor(() => expect(toast.warning).toHaveBeenCalled())
    unmount()
    expect(toast.dismiss).toHaveBeenCalledWith(CHAIR_TOAST_ID)
    expect(toast.dismiss).toHaveBeenCalledWith(SCHEDULE_TOAST_ID)
  })

  it("no renderiza ningún elemento visible en el DOM", () => {
    const { container } = render(<StaffAlerts hasChair={true} hasSchedule={true} role="STAFF" />)
    expect(container.firstChild).toBeNull()
  })
})
