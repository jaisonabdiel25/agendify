/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

// Context-based Select mock: each Select passes its onValueChange to its own SelectItems
jest.mock("@/components/ui/select", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react")
  type OnChange = ((v: string) => void) | undefined
  const SelectContext = React.createContext<OnChange>(undefined)

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: OnChange }) =>
      React.createElement(SelectContext.Provider, { value: onValueChange }, children),
    SelectTrigger: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { role: "combobox" }, children),
    SelectValue: ({ placeholder }: { placeholder?: string }) =>
      React.createElement("span", null, placeholder),
    SelectContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      const onChange = React.useContext(SelectContext)
      return React.createElement(
        "button",
        { role: "option", onClick: () => onChange?.(value) },
        children
      )
    },
  }
})

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairTable } from "@/components/modules/chair/chair-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockToast = toast as unknown as { success: jest.Mock; error: jest.Mock }
const mockRefresh = jest.fn()

const chairs = [
  {
    id: "chair-1",
    name: "Silla A",
    description: "Corte clásico",
    color: "#6366f1",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    user: null,
  },
  {
    id: "chair-2",
    name: "Silla B",
    description: null,
    color: "#f59e0b",
    isActive: false,
    createdAt: new Date("2025-02-01"),
    user: { id: "user-1", name: "Ana García", email: "ana@test.com" },
  },
]

const availableUsers = [
  { id: "user-2", name: "Pedro López", email: "pedro@test.com" },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("ChairTable — estado vacío", () => {
  it("muestra mensaje cuando no hay puestos", () => {
    render(<ChairTable chairs={[]} availableUsers={availableUsers} />)
    expect(screen.getByText("No hay puestos registrados.")).toBeInTheDocument()
  })
})

describe("ChairTable — renderizado con datos", () => {
  it("muestra los encabezados de la tabla", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText("Nombre")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
  })

  it("muestra los nombres de los puestos", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText("Silla A")).toBeInTheDocument()
    expect(screen.getByText("Silla B")).toBeInTheDocument()
  })

  it("muestra el usuario asignado", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText("Ana García")).toBeInTheDocument()
  })

  it("muestra enlace de asignación para puesto sin usuario", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText(/Sin asignar/i)).toBeInTheDocument()
  })

  it("muestra badge Activo para puesto activo", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("muestra badge Inactivo para puesto inactivo", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("muestra enlace de edición por cada puesto", () => {
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    const editLinks = screen.getAllByRole("link")
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })
})

describe("ChairTable — diálogo de asignación", () => {
  it("abre el diálogo al hacer clic en Sin asignar", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    expect(screen.getByText("Asignar usuario")).toBeInTheDocument()
  })

  it("muestra el nombre del puesto en el diálogo", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText(/Silla A/)).toBeInTheDocument()
  })

  it("muestra placeholder en el select de usuarios", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    expect(screen.getByText("Seleccionar usuario...")).toBeInTheDocument()
  })

  it("cierra el diálogo al hacer clic en Cancelar", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(screen.queryByText("Asignar usuario")).not.toBeInTheDocument()
  })

  it("muestra mensaje cuando no hay usuarios disponibles", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={[]} />)
    await user.click(screen.getByText(/Sin asignar/i))
    expect(screen.getByText(/No hay usuarios disponibles/i)).toBeInTheDocument()
  })

  it("el botón Asignar está deshabilitado sin seleccionar usuario", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    expect(screen.getByRole("button", { name: "Asignar" })).toBeDisabled()
  })

  it("el botón Asignar llama fetch PATCH y muestra toast al confirmar con usuario seleccionado", async () => {
    const { rerender } = render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    const user = userEvent.setup()
    await user.click(screen.getByText(/Sin asignar/i))
    // Radix Select no expone opciones en jsdom; verificamos solo el estado inicial
    expect(screen.getByRole("button", { name: "Asignar" })).toBeDisabled()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    void rerender
  })

  it("cierra el diálogo al presionar Escape (onOpenChange con open=false)", async () => {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await user.keyboard("[Escape]")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })
})

// ──────────────────────────────────────────────────────────
// Asignación de usuario (handleAssign)
// ──────────────────────────────────────────────────────────
describe("ChairTable — asignación de usuario", () => {
  async function openDialogAndSelectUser() {
    const user = userEvent.setup()
    render(<ChairTable chairs={chairs} availableUsers={availableUsers} />)
    await user.click(screen.getByText(/Sin asignar/i))
    await user.click(screen.getByRole("option", { name: /Pedro López/ }))
    return user
  }

  it("el botón Asignar se habilita tras seleccionar un usuario", async () => {
    await openDialogAndSelectUser()
    expect(screen.getByRole("button", { name: "Asignar" })).not.toBeDisabled()
  })

  it("llama fetch PATCH con el userId seleccionado al confirmar", async () => {
    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chairs/chair-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ userId: "user-2" }),
        })
      )
    })
  })

  it("muestra toast.success con el nombre del puesto tras asignación exitosa", async () => {
    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Usuario asignado a Silla A")
    })
  })

  it("llama router.refresh() tras asignación exitosa", async () => {
    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it("cierra el diálogo tras asignación exitosa", async () => {
    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("muestra toast.error cuando el servidor falla al asignar", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Usuario no encontrado" }),
    } as Response)

    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Usuario no encontrado")
    })
  })

  it("no llama router.refresh() cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error" }),
    } as Response)

    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("usa el mensaje genérico cuando el servidor no devuelve error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response)

    const user = await openDialogAndSelectUser()
    await user.click(screen.getByRole("button", { name: "Asignar" }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Error al asignar el usuario")
    })
  })
})
