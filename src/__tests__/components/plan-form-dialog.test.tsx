/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock("@/components/ui/dialog", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  return {
    Dialog: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    DialogTrigger: ({ children }: { children: React.ReactNode }) => children,
    DialogContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "dialog-content" }, children),
    DialogHeader: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    DialogFooter: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    DialogTitle: ({ children }: { children: React.ReactNode }) =>
      React.createElement("h2", null, children),
  }
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PlanFormDialog } from "@/components/modules/admin/plan-form-dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockRefresh = jest.fn()

const mockPlan = {
  id: "plan_pro_v1",
  type: "PRO",
  name: "Pro",
  maxServices: 2,
  maxChairs: 3,
  maxUsers: 3,
  canInvite: true,
  statisticsCharts: ["*"],
  price: "29.99",
  discount: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ...mockPlan }),
  } as Response)
})

// ─── Modo edición ─────────────────────────────────────────────────────────────

describe("PlanFormDialog — modo edición (renderizado)", () => {
  it("muestra el título con el nombre del plan", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByRole("heading", { name: "Editar plan: Pro" })).toBeInTheDocument()
  })

  it("precarga el campo nombre con el valor del plan", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByLabelText("Nombre")).toHaveValue("Pro")
  })

  it("precarga maxServices con el valor del plan", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByLabelText("Servicios")).toHaveValue(2)
  })

  it("precarga price como número desde string", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByLabelText("Precio (USD)")).toHaveValue(29.99)
  })

  it("muestra el campo precio vacío cuando price es null", () => {
    render(<PlanFormDialog plan={{ ...mockPlan, price: null }} />)
    expect(screen.getByLabelText("Precio (USD)")).toHaveValue(null)
  })

  it("el campo tipo es readonly en modo edición", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByLabelText("Tipo")).toHaveAttribute("readonly")
  })

  it("muestra nota de que el tipo no es editable", () => {
    render(<PlanFormDialog plan={mockPlan} />)
    expect(screen.getByText(/El tipo identifica al plan/i)).toBeInTheDocument()
  })
})

describe("PlanFormDialog — modo edición (submit)", () => {
  it("llama PATCH a /api/admin/plans/:id al guardar", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog plan={mockPlan} />)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/plans/${mockPlan.id}`,
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("llama router.refresh() tras éxito", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog plan={mockPlan} />)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })

  it("muestra toast.success tras éxito", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog plan={mockPlan} />)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it("muestra box de error rojo cuando el servidor responde con error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Plan no encontrado." }),
    } as Response)
    const user = userEvent.setup()
    render(<PlanFormDialog plan={mockPlan} />)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(screen.getByText("Plan no encontrado.")).toBeInTheDocument()
    })
  })

  it("muestra error genérico si la respuesta no tiene body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<PlanFormDialog plan={mockPlan} />)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(screen.getByText("Error al guardar el plan.")).toBeInTheDocument()
    })
  })
})

// ─── Modo creación ────────────────────────────────────────────────────────────

describe("PlanFormDialog — modo creación (renderizado)", () => {
  it("muestra el título Crear plan", () => {
    render(<PlanFormDialog />)
    expect(screen.getByRole("heading", { name: "Crear plan" })).toBeInTheDocument()
  })

  it("el campo nombre comienza vacío", () => {
    render(<PlanFormDialog />)
    expect(screen.getByLabelText("Nombre")).toHaveValue("")
  })

  it("el campo tipo no es readonly en modo creación", () => {
    render(<PlanFormDialog />)
    expect(screen.getByLabelText("Tipo")).not.toHaveAttribute("readonly")
  })

  it("el campo precio comienza vacío", () => {
    render(<PlanFormDialog />)
    expect(screen.getByLabelText("Precio (USD)")).toHaveValue(null)
  })
})

describe("PlanFormDialog — modo creación (submit)", () => {
  it("llama POST a /api/admin/plans al crear", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog />)
    await user.type(screen.getByLabelText("Tipo"), "ENTERPRISE")
    await user.type(screen.getByLabelText("Nombre"), "Enterprise")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/plans",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("llama router.refresh() tras crear", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog />)
    await user.type(screen.getByLabelText("Tipo"), "ENTERPRISE")
    await user.type(screen.getByLabelText("Nombre"), "Enterprise")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })
})

// ─── Validación ───────────────────────────────────────────────────────────────

describe("PlanFormDialog — validación", () => {
  it("no llama fetch cuando el nombre está vacío", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog />)
    await user.type(screen.getByLabelText("Tipo"), "ENTERPRISE")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it("no llama fetch cuando el tipo está vacío", async () => {
    const user = userEvent.setup()
    render(<PlanFormDialog />)
    await user.type(screen.getByLabelText("Nombre"), "Enterprise")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
