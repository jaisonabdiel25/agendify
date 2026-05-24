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
import { CreateBusinessForm } from "@/components/modules/admin/create-business-form"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()

const mockPlans = [
  { id: "plan_standard_v1", name: "Estándar" },
  { id: "plan_pro_v1", name: "Pro" },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "biz-1", name: "Test", slug: "test" }),
  } as Response)
})

describe("CreateBusinessForm — renderizado", () => {
  it("muestra el campo de nombre", () => {
    render(<CreateBusinessForm plans={mockPlans} />)
    expect(screen.getByLabelText("Nombre del negocio")).toBeInTheDocument()
  })

  it("muestra el botón Crear negocio", () => {
    render(<CreateBusinessForm plans={mockPlans} />)
    expect(screen.getByRole("button", { name: "Crear negocio" })).toBeInTheDocument()
  })

  it("muestra el selector de plan con las opciones", () => {
    render(<CreateBusinessForm plans={mockPlans} />)
    expect(screen.getByRole("option", { name: "Estándar" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Pro" })).toBeInTheDocument()
  })
})

describe("CreateBusinessForm — submit exitoso", () => {
  it("llama fetch con el nombre y planId correctos", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/businesses",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Mi Barbería", planId: "plan_pro_v1" }),
        })
      )
    })
  })

  it("muestra mensaje de éxito al crear el negocio", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Negocio creado correctamente.")).toBeInTheDocument()
    })
  })

  it("llama router.refresh() tras crear el negocio", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })
})

describe("CreateBusinessForm — error del servidor", () => {
  it("muestra el error cuando el servidor responde con un error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Ya existe ese negocio." }),
    } as Response)
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Ya existe ese negocio.")).toBeInTheDocument()
    })
  })

  it("muestra error genérico si la respuesta no tiene body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Error al crear el negocio.")).toBeInTheDocument()
    })
  })
})

describe("CreateBusinessForm — validación", () => {
  it("no llama a fetch cuando el nombre está vacío", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it("no llama a fetch cuando no se selecciona plan", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm plans={mockPlans} />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
