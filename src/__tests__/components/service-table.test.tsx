/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ServiceTable } from "@/components/modules/service/service-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const mockToast = toast as unknown as { success: jest.Mock; error: jest.Mock }
const mockRefresh = jest.fn()

const services = [
  {
    id: "srv-1",
    name: "Corte clásico",
    description: "El corte de siempre",
    durationMinutes: 30,
    price: "25.00",
    color: "#6366f1",
    isActive: true,
  },
  {
    id: "srv-2",
    name: "Coloración",
    description: null,
    durationMinutes: 90,
    price: "80.00",
    color: "#f59e0b",
    isActive: false,
  },
]

const chairs = [
  { id: "chair-1", name: "Silla A" },
  { id: "chair-2", name: "Silla B" },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ([]),
  } as Response)
})

describe("ServiceTable — estado vacío", () => {
  it("muestra mensaje cuando no hay servicios", () => {
    render(<ServiceTable services={[]} chairs={chairs} />)
    expect(screen.getByText("No hay servicios registrados.")).toBeInTheDocument()
  })
})

describe("ServiceTable — renderizado con datos", () => {
  it("muestra los encabezados de la tabla", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("Nombre")).toBeInTheDocument()
    expect(screen.getByText("Duración")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
  })

  it("muestra los nombres de los servicios", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("Corte clásico")).toBeInTheDocument()
    expect(screen.getByText("Coloración")).toBeInTheDocument()
  })

  it("muestra la duración en minutos", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("30 min")).toBeInTheDocument()
    expect(screen.getByText("90 min")).toBeInTheDocument()
  })

  it("muestra el precio formateado", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("$25.00")).toBeInTheDocument()
    expect(screen.getByText("$80.00")).toBeInTheDocument()
  })

  it("muestra badge Activo para servicio activo", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("muestra badge Inactivo para servicio inactivo", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("muestra la descripción del servicio", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    expect(screen.getByText("El corte de siempre")).toBeInTheDocument()
  })

  it("muestra enlace de edición por cada servicio", () => {
    render(<ServiceTable services={services} chairs={chairs} />)
    const editLinks = screen.getAllByRole("link")
    expect(editLinks.length).toBeGreaterThanOrEqual(2)
  })
})

describe("ServiceTable — diálogo de asignación", () => {
  it("abre el diálogo al hacer clic en Asignar a puestos", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("muestra los puestos disponibles en el diálogo", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => {
      expect(screen.getByText("Silla A")).toBeInTheDocument()
      expect(screen.getByText("Silla B")).toBeInTheDocument()
    })
  })

  it("muestra checkboxes desmarcados por defecto", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox")
      checkboxes.forEach((cb) => expect(cb).not.toBeChecked())
    })
  })

  it("marca el checkbox al hacer clic", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => screen.getByText("Silla A"))
    const checkboxes = screen.getAllByRole("checkbox")
    await user.click(checkboxes[0])
    expect(checkboxes[0]).toBeChecked()
  })

  it("cierra el diálogo al hacer clic en Cancelar", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => screen.getByRole("dialog"))
    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("guarda la asignación al hacer clic en Guardar", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/services/srv-1/chairs",
        expect.objectContaining({ method: "PUT" })
      )
    })
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled())
  })

  it("muestra toast de error cuando falla guardar", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ([]) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Error" }) } as Response)
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={chairs} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })

  it("muestra mensaje cuando no hay puestos disponibles", async () => {
    const user = userEvent.setup()
    render(<ServiceTable services={services} chairs={[]} />)
    const assignButtons = screen.getAllByText("Asignar a puestos")
    await user.click(assignButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/No hay puestos activos/i)).toBeInTheDocument()
    })
  })
})
