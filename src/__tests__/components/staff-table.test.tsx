/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StaffTable } from "@/components/modules/admin/staff-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

const baseUsers = [
  { id: "user-owner", name: "Propietario", email: "owner@test.com", role: "OWNER" as const, isActive: true, chairName: null },
  { id: "user-staff", name: "Staff Uno", email: "staff@test.com", role: "STAFF" as const, isActive: false, chairName: "Silla 1" },
]

describe("StaffTable — renderizado", () => {
  it("muestra los nombres de los usuarios", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getAllByText("Propietario").length).toBeGreaterThan(0)
    expect(screen.getByText("Staff Uno")).toBeInTheDocument()
  })

  it("muestra el correo electrónico de cada usuario", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getAllByText("owner@test.com").length).toBeGreaterThan(0)
    expect(screen.getAllByText("staff@test.com").length).toBeGreaterThan(0)
  })

  it("muestra el nombre del puesto asignado", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getByText("Silla 1")).toBeInTheDocument()
  })

  it('muestra "—" cuando el usuario no tiene puesto asignado', () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getAllByText("—").length).toBeGreaterThan(0)
  })

  it("muestra el badge de uso del plan", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("/ 3 usuarios activos", { exact: false })).toBeInTheDocument()
  })

  it("renderiza un switch por cada usuario", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    const switches = screen.getAllByRole("switch")
    expect(switches).toHaveLength(2)
  })

  it("el switch del OWNER propio está deshabilitado", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    const switches = screen.getAllByRole("switch")
    expect(switches[0]).toBeDisabled()
  })

  it("el switch del STAFF no está deshabilitado", () => {
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)
    const switches = screen.getAllByRole("switch")
    expect(switches[1]).not.toBeDisabled()
  })

  it('muestra mensaje vacío si no hay usuarios', () => {
    render(<StaffTable users={[]} activeCount={0} maxUsers={3} currentUserId="user-owner" />)
    expect(screen.getByText(/no hay usuarios/i)).toBeInTheDocument()
  })
})

describe("StaffTable — interacción del switch", () => {
  it("hace fetch PATCH al hacer clic en el switch del STAFF", async () => {
    const user = userEvent.setup()
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[1])

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/business/users/user-staff",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("envía isActive: true al activar un usuario inactivo", async () => {
    const user = userEvent.setup()
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[1])

    const call = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.isActive).toBe(true)
  })

  it("llama a router.refresh() tras una respuesta ok", async () => {
    const user = userEvent.setup()
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[1])

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })

  it("revierte el switch y muestra toast de error cuando la respuesta es 409", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Límite alcanzado" }),
    } as unknown as Response)

    const user = userEvent.setup()
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[1])

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Límite alcanzado")
    })
    expect(switches[1]).toHaveAttribute("aria-checked", "false")
  })

  it("no hace fetch al hacer clic en el switch deshabilitado del OWNER", async () => {
    const user = userEvent.setup()
    render(<StaffTable users={baseUsers} activeCount={1} maxUsers={3} currentUserId="user-owner" />)

    const switches = screen.getAllByRole("switch")
    await user.click(switches[0])

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
