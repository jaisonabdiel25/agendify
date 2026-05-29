/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const Ctx = React.createContext(undefined)
  return {
    Select: ({ onValueChange, children }: { onValueChange?: (v: string) => void; children: React.ReactNode }) =>
      React.createElement(Ctx.Provider, { value: onValueChange }, children),
    SelectTrigger: ({ children, id, "aria-invalid": ariaInvalid }: { children?: React.ReactNode; id?: string; "aria-invalid"?: boolean }) =>
      React.createElement("button", { type: "button", role: "combobox", id, "aria-invalid": ariaInvalid }, children),
    SelectValue: ({ placeholder }: { placeholder?: string }) =>
      React.createElement("span", null, placeholder),
    SelectContent: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    SelectItem: ({ value, children }: { value: string; children?: React.ReactNode }) => {
      const onValueChange = React.useContext(Ctx)
      return React.createElement("button", {
        type: "button",
        role: "option",
        onClick: () => onValueChange && onValueChange(value),
      }, children)
    },
  }
})

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
  { id: "biz-1", name: "Mi Barbería", canInvite: true, maxUsers: 3, userCount: 1 },
  { id: "biz-2", name: "Salón Elite", canInvite: true, maxUsers: 3, userCount: 0 },
]

const businessesAtLimit = [
  { id: "biz-3", name: "Barbería Llena", canInvite: true, maxUsers: 3, userCount: 3 },
]

const businessesStandard = [
  { id: "biz-4", name: "Negocio Estándar", canInvite: false, maxUsers: 1, userCount: 1 },
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

describe("CreateInvitationForm — límites de plan", () => {
  it("muestra advertencia y deshabilita botón cuando el negocio PRO alcanzó el límite de usuarios", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businessesAtLimit} />)
    await user.click(screen.getByRole("option", { name: "Barbería Llena" }))
    expect(
      screen.getByText(/El plan Pro permite hasta 3 usuarios\. Ya se alcanzó el límite\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeDisabled()
  })

  it("muestra advertencia y deshabilita botón para plan Estándar", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businessesStandard} />)
    await user.click(screen.getByRole("option", { name: "Negocio Estándar" }))
    expect(
      screen.getByText(/El plan Estándar no permite generar invitaciones/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generar invitación" })).toBeDisabled()
  })

  it("no muestra advertencia ni deshabilita cuando el negocio PRO tiene cupo disponible", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
    expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generar invitación" })).not.toBeDisabled()
  })

  it("no llama fetch cuando el límite está alcanzado", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businessesAtLimit} />)
    await user.click(screen.getByRole("option", { name: "Barbería Llena" }))
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe("CreateInvitationForm — submit exitoso", () => {
  it("llama fetch con el businessId seleccionado", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
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
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByText("ABCD-1234")).toBeInTheDocument()
    })
  })

  it("muestra botón de copiar tras generar código", async () => {
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
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
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
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
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByText("Error al generar")).toBeInTheDocument()
    })
  })

  it("muestra error genérico cuando el servidor falla sin body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<CreateInvitationForm businesses={businesses} />)
    await user.click(screen.getByRole("option", { name: "Mi Barbería" }))
    await user.click(screen.getByRole("button", { name: "Generar invitación" }))
    await waitFor(() => {
      expect(screen.getByText("Error al generar la invitación.")).toBeInTheDocument()
    })
  })
})

describe("CreateInvitationForm — negocio sin planType", () => {
  it("muestra advertencia cuando el negocio no tiene plan asignado", async () => {
    const user = userEvent.setup()
    const businessesSinPlan = [{ id: "biz-5", name: "Sin Plan", canInvite: null, maxUsers: null, userCount: 0 }]
    render(<CreateInvitationForm businesses={businessesSinPlan} />)
    await user.click(screen.getByRole("option", { name: "Sin Plan" }))
    expect(screen.getByText(/no tiene un plan asignado/i)).toBeInTheDocument()
  })
})
