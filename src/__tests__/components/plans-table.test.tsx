/**
 * @jest-environment jsdom
 */

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const Ctx = React.createContext(undefined)
  return {
    Select: ({ onValueChange, children }: { onValueChange?: (v: string) => void; children: React.ReactNode }) =>
      React.createElement(Ctx.Provider, { value: onValueChange }, children),
    SelectTrigger: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("button", { type: "button", role: "combobox" }, children),
    SelectValue: () => React.createElement("span", null),
    SelectContent: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children),
    SelectItem: ({ value, children }: { value: string; children?: React.ReactNode }) => {
      const onValueChange = React.useContext(Ctx)
      return React.createElement("button", {
        type: "button",
        role: "option",
        "data-value": value,
        onClick: () => onValueChange && onValueChange(value),
      }, children)
    },
  }
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PlansTable } from "@/components/modules/admin/plans-table"
import { toast } from "sonner"

const plans = [
  { id: "plan_standard_v1", name: "Estándar" },
  { id: "plan_pro_v1", name: "Pro" },
]

const businesses = [
  { id: "biz-1", name: "Mi Barbería", slug: "mi-barberia", isActive: true, plan: { id: "plan_standard_v1", name: "Estándar" } },
  { id: "biz-2", name: "Salón Elite", slug: "salon-elite", isActive: false, plan: { id: "plan_pro_v1", name: "Pro" } },
]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("PlansTable — renderizado vacío", () => {
  it("muestra mensaje cuando no hay negocios", () => {
    render(<PlansTable businesses={[]} plans={plans} />)
    expect(screen.getByText("No hay negocios registrados.")).toBeInTheDocument()
  })
})

describe("PlansTable — renderizado con negocios", () => {
  it("muestra los nombres de los negocios", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    expect(screen.getByText("Mi Barbería")).toBeInTheDocument()
    expect(screen.getByText("Salón Elite")).toBeInTheDocument()
  })

  it("muestra los slugs de los negocios", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    expect(screen.getByText("mi-barberia")).toBeInTheDocument()
    expect(screen.getByText("salon-elite")).toBeInTheDocument()
  })

  it("muestra el badge Activo para negocios activos", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("muestra el badge Inactivo para negocios inactivos", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("muestra las opciones de plan disponibles", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    const standardOptions = screen.getAllByRole("option", { name: "Estándar" })
    expect(standardOptions.length).toBeGreaterThan(0)
  })

  it("muestra los botones de Guardar", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    const saveButtons = screen.getAllByRole("button", { name: "Guardar" })
    expect(saveButtons.length).toBe(2)
  })

  it("el botón Guardar está deshabilitado si no hay cambios", () => {
    render(<PlansTable businesses={businesses} plans={plans} />)
    const saveButtons = screen.getAllByRole("button", { name: "Guardar" })
    saveButtons.forEach((btn) => expect(btn).toBeDisabled())
  })
})

describe("PlansTable — cambio de plan", () => {
  it("el botón Guardar se habilita al cambiar el plan", async () => {
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    expect(screen.getByRole("button", { name: "Guardar" })).not.toBeDisabled()
  })

  it("llama fetch PATCH al guardar el nuevo plan", async () => {
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/businesses/biz-1/plan",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ planId: "plan_pro_v1" }),
        })
      )
    })
  })

  it("muestra toast de éxito al guardar correctamente", async () => {
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Mi Barbería"))
    })
  })

  it("el botón muestra Guardando... mientras se envía", async () => {
    let resolveFetch!: (v: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise((r) => { resolveFetch = r }))
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    expect(await screen.findByRole("button", { name: "Guardando..." })).toBeDisabled()
    resolveFetch({ ok: true, json: async () => ({}) })
  })
})

describe("PlansTable — error del servidor", () => {
  it("muestra toast de error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error interno" }),
    } as Response)
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error interno")
    })
  })

  it("revierte la selección cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error interno" }),
    } as Response)
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("muestra toast de error genérico cuando no hay body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<PlansTable businesses={[businesses[0]]} plans={plans} />)
    await user.click(screen.getByRole("option", { name: "Pro" }))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al actualizar el plan")
    })
  })
})
