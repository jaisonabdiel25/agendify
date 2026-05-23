/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateInvitationForm } from "@/components/modules/admin/create-invitation-form"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "inv-1", code: "ABCD-1234" }),
  } as Response)
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
})

const businesses = [
  { id: "biz-1", name: "Mi Barbería" },
  { id: "biz-2", name: "Salón Elite" },
]

describe("CreateInvitationForm — renderizado", () => {
  it("muestra el select con las opciones de negocio", () => {
    render(<CreateInvitationForm businesses={businesses} />)
    expect(screen.getByText("Mi Barbería")).toBeInTheDocument()
    expect(screen.getByText("Salón Elite")).toBeInTheDocument()
  })

  it("muestra el botón Generar invitación", () => {
    render(<CreateInvitationForm businesses={businesses} />)
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeInTheDocument()
  })

  it("deshabilita el botón cuando no hay negocios", () => {
    render(<CreateInvitationForm businesses={[]} />)
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeDisabled()
  })

  it("muestra mensaje cuando no hay negocios", () => {
    render(<CreateInvitationForm businesses={[]} />)
    expect(screen.getByText(/Crea un negocio primero/i)).toBeInTheDocument()
  })
})

describe("CreateInvitationForm — submit exitoso", () => {
  it("llama fetch con el businessId seleccionado", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.selectOptions(screen.getByRole("combobox"), "biz-1")
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/invitations",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ businessId: "biz-1" }),
        })
      )
    })
  })

  it("muestra el código generado tras el submit", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.selectOptions(screen.getByRole("combobox"), "biz-1")
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByText("ABCD-1234")).toBeInTheDocument()
    })
  })

  it("muestra botón de copiar tras generar código", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.selectOptions(screen.getByRole("combobox"), "biz-1")
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Copiar código")).toBeInTheDocument()
    })
  })

  it("copia el código al portapapeles", async () => {
    const user = userEvent.setup()
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })
    render(<CreateInvitationForm businesses={businesses} />)
    await user.selectOptions(screen.getByRole("combobox"), "biz-1")
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => screen.getByLabelText("Copiar código"))
    await user.click(screen.getByLabelText("Copiar código"))
    expect(writeTextMock).toHaveBeenCalledWith("ABCD-1234")
  })
})

describe("CreateInvitationForm — error del servidor", () => {
  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al generar" }),
    } as Response)
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.selectOptions(screen.getByRole("combobox"), "biz-1")
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByText("Error al generar")).toBeInTheDocument()
    })
  })
})
