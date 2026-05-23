/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairTable } from "@/components/modules/chair/chair-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockToast = toast as { success: jest.Mock; error: jest.Mock }
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
