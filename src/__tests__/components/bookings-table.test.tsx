/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BookingsTable } from "@/components/modules/booking/bookings-table"
import type { BookingRow } from "@/components/modules/booking/bookings-table"
import { useRouter } from "next/navigation"

const mockPush = jest.fn()
const routerMock = useRouter as jest.Mock

function makeBooking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: "book-1",
    startTime: "2025-06-15T10:00:00.000Z",
    endTime: "2025-06-15T10:30:00.000Z",
    status: "CONFIRMED",
    notes: null,
    service: {
      id: "s1",
      name: "Corte clásico",
      color: "#6366f1",
      durationMinutes: 30,
      price: "25.00",
    },
    chair: { id: "c1", name: "Silla A" },
    customer: { id: "cust-1", name: "Ana García", phone: "+507 6000-0000" },
    ...overrides,
  }
}

const defaultProps = {
  bookings: [] as BookingRow[],
  myChairIds: [] as string[],
  role: "OWNER" as const,
  totalCount: 0,
  page: 1,
  pageSize: 10,
  currentFilter: "all" as const,
}

beforeEach(() => {
  routerMock.mockReturnValue({ push: mockPush })
  jest.clearAllMocks()
})

// ─── Estado vacío ─────────────────────────────────────────────────────────────

describe("BookingsTable — estado vacío", () => {
  it("muestra 'No hay reservas para mostrar.' con array vacío", () => {
    render(<BookingsTable {...defaultProps} />)
    expect(screen.getByText("No hay reservas para mostrar.")).toBeInTheDocument()
  })

  it("muestra mensaje de sin puesto asignado para OWNER con filtro mine sin puestos", () => {
    render(<BookingsTable {...defaultProps} myChairIds={[]} currentFilter="mine" />)
    expect(screen.getByText("No tienes puestos asignados.")).toBeInTheDocument()
  })

  it("NO muestra mensaje sin puesto para STAFF con filtro mine", () => {
    render(<BookingsTable {...defaultProps} role="STAFF" myChairIds={[]} currentFilter="mine" />)
    expect(screen.queryByText("No tienes puestos asignados.")).not.toBeInTheDocument()
  })
})

// ─── Filtros ──────────────────────────────────────────────────────────────────

describe("BookingsTable — filtros de vista", () => {
  it("muestra botones de filtro para rol OWNER", () => {
    render(<BookingsTable {...defaultProps} />)
    expect(screen.getByText("Todas las reservas")).toBeInTheDocument()
    expect(screen.getByText("Mis reservas")).toBeInTheDocument()
  })

  it("muestra botones de filtro para rol ADMIN", () => {
    render(<BookingsTable {...defaultProps} role="ADMIN" />)
    expect(screen.getByText("Todas las reservas")).toBeInTheDocument()
  })

  it("no muestra botones de filtro para rol STAFF", () => {
    render(<BookingsTable {...defaultProps} role="STAFF" />)
    expect(screen.queryByText("Todas las reservas")).not.toBeInTheDocument()
  })

  it("navega con filtro=mine al hacer clic en Mis reservas", async () => {
    const user = userEvent.setup()
    render(<BookingsTable {...defaultProps} />)
    await user.click(screen.getByText("Mis reservas"))
    expect(mockPush).toHaveBeenCalledWith("/booking?filter=mine")
  })

  it("navega sin filtro al hacer clic en Todas las reservas", async () => {
    const user = userEvent.setup()
    render(<BookingsTable {...defaultProps} currentFilter="mine" />)
    await user.click(screen.getByText("Todas las reservas"))
    expect(mockPush).toHaveBeenCalledWith("/booking")
  })
})

// ─── Tabla con datos ──────────────────────────────────────────────────────────

describe("BookingsTable — renderizado de datos", () => {
  it("muestra los encabezados de la tabla", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={1} />)
    expect(screen.getByText("Fecha")).toBeInTheDocument()
    expect(screen.getByText("Cliente")).toBeInTheDocument()
    expect(screen.getByText("Servicio")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
  })

  it("muestra el nombre del cliente", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={1} />)
    expect(screen.getByText("Ana García")).toBeInTheDocument()
  })

  it("muestra el nombre del servicio", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={1} />)
    expect(screen.getByText("Corte clásico")).toBeInTheDocument()
  })

  it("muestra 'Pendiente' para status PENDING", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking({ status: "PENDING" })]} totalCount={1} />)
    expect(screen.getByText("Pendiente")).toBeInTheDocument()
  })

  it("muestra 'Confirmada' para status CONFIRMED", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking({ status: "CONFIRMED" })]} totalCount={1} />)
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
  })

  it("muestra 'Cancelada' para status CANCELLED", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking({ status: "CANCELLED" })]} totalCount={1} />)
    expect(screen.getByText("Cancelada")).toBeInTheDocument()
  })

  it("muestra 'Completada' para status COMPLETED", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking({ status: "COMPLETED" })]} totalCount={1} />)
    expect(screen.getByText("Completada")).toBeInTheDocument()
  })

  it("muestra 'No asistió' para status NO_SHOW", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking({ status: "NO_SHOW" })]} totalCount={1} />)
    expect(screen.getByText("No asistió")).toBeInTheDocument()
  })

  it("muestra el rango correcto en el footer (1–1 de 1 reservas)", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={1} />)
    expect(screen.getByText("1–1 de 1 reservas")).toBeInTheDocument()
  })

  it("muestra 'Sin resultados' cuando totalCount es 0 pero bookings está vacío", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={0} />)
    expect(screen.getByText("Sin resultados")).toBeInTheDocument()
  })
})

// ─── Paginación ───────────────────────────────────────────────────────────────

describe("BookingsTable — paginación", () => {
  it("no muestra paginación cuando hay solo 1 página", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={5} pageSize={10} />)
    expect(screen.queryByLabelText("Página anterior")).not.toBeInTheDocument()
  })

  it("muestra paginación cuando hay más de una página", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={15} pageSize={10} />)
    expect(screen.getByLabelText("Página anterior")).toBeInTheDocument()
    expect(screen.getByLabelText("Página siguiente")).toBeInTheDocument()
  })

  it("el botón anterior está deshabilitado en la primera página", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={15} pageSize={10} page={1} />)
    expect(screen.getByLabelText("Página anterior")).toBeDisabled()
  })

  it("el botón siguiente está deshabilitado en la última página", () => {
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={15} pageSize={10} page={2} />)
    expect(screen.getByLabelText("Página siguiente")).toBeDisabled()
  })

  it("navega a la página siguiente al hacer clic en siguiente", async () => {
    const user = userEvent.setup()
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={15} pageSize={10} page={1} />)
    await user.click(screen.getByLabelText("Página siguiente"))
    expect(mockPush).toHaveBeenCalledWith("/booking?page=2")
  })

  it("navega a la página anterior al hacer clic en anterior", async () => {
    const user = userEvent.setup()
    render(<BookingsTable {...defaultProps} bookings={[makeBooking()]} totalCount={15} pageSize={10} page={2} />)
    await user.click(screen.getByLabelText("Página anterior"))
    expect(mockPush).toHaveBeenCalledWith("/booking")
  })

  it("incluye el filtro en la URL al paginar con filtro activo", async () => {
    const user = userEvent.setup()
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking()]}
        myChairIds={["c1"]}
        totalCount={15}
        pageSize={10}
        page={1}
        currentFilter="mine"
      />
    )
    await user.click(screen.getByLabelText("Página siguiente"))
    expect(mockPush).toHaveBeenCalledWith("/booking?page=2&filter=mine")
  })

  it("muestra puntos suspensivos cuando hay más de 7 páginas", () => {
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking()]}
        totalCount={100}
        pageSize={10}
        page={5}
      />
    )
    const ellipses = screen.getAllByText("…")
    expect(ellipses.length).toBeGreaterThanOrEqual(2)
  })

  it("muestra páginas numéricas correctas alrededor de la página actual", () => {
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking()]}
        totalCount={100}
        pageSize={10}
        page={5}
      />
    )
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument()
  })

  it("navega a una página numerada al hacer clic en ella", async () => {
    const user = userEvent.setup()
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking()]}
        totalCount={100}
        pageSize={10}
        page={5}
      />
    )
    await user.click(screen.getByRole("button", { name: "4" }))
    expect(mockPush).toHaveBeenCalledWith("/booking?page=4")
  })
})

// ─── Notas y teléfono ────────────────────────────────────────────────────────

describe("BookingsTable — notas y teléfono", () => {
  it("muestra las notas de la reserva cuando existen", () => {
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking({ notes: "Alérgico al tinte" })]}
        totalCount={1}
      />
    )
    expect(screen.getByText("Alérgico al tinte")).toBeInTheDocument()
  })

  it("muestra el teléfono del cliente cuando está disponible", () => {
    render(
      <BookingsTable
        {...defaultProps}
        bookings={[makeBooking({ customer: { id: "cust-1", name: "Ana García", phone: "+507 6000-0000" } })]}
        totalCount={1}
      />
    )
    expect(screen.getByText("+507 6000-0000")).toBeInTheDocument()
  })
})
