/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CalendarToolbar } from "@/components/modules/calendar/calendar-toolbar"

const defaultProps = {
  view: "day" as const,
  rangeLabel: "15 de junio, 2025",
  isLoading: false,
  showOnlyMine: false,
  canToggle: false,
  onViewChange: jest.fn(),
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onToday: jest.fn(),
  onToggleOnlyMine: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

describe("CalendarToolbar — renderizado básico", () => {
  it("muestra el rangeLabel", () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.getByText("15 de junio, 2025")).toBeInTheDocument()
  })

  it("muestra el botón Hoy", () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.getByRole("button", { name: "Hoy" })).toBeInTheDocument()
  })

  it("muestra los botones de vista sin Equipo cuando canToggle=false", () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.queryByText("Equipo")).not.toBeInTheDocument()
    expect(screen.getByText("Día")).toBeInTheDocument()
    expect(screen.getByText("Semana")).toBeInTheDocument()
    expect(screen.getByText("Mes")).toBeInTheDocument()
  })

  it("muestra el botón Equipo cuando canToggle=true", () => {
    render(<CalendarToolbar {...defaultProps} canToggle />)
    expect(screen.getByText("Equipo")).toBeInTheDocument()
  })

  it("aplica opacity-50 al rangeLabel cuando isLoading=true", () => {
    render(<CalendarToolbar {...defaultProps} isLoading />)
    const label = screen.getByText("15 de junio, 2025")
    expect(label.className).toContain("opacity-50")
  })

  it("NO aplica opacity-50 al rangeLabel cuando isLoading=false", () => {
    render(<CalendarToolbar {...defaultProps} isLoading={false} />)
    const label = screen.getByText("15 de junio, 2025")
    expect(label.className).not.toContain("opacity-50")
  })
})

describe("CalendarToolbar — navegación", () => {
  it("llama a onToday al hacer clic en Hoy", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    await user.click(screen.getByRole("button", { name: "Hoy" }))
    expect(defaultProps.onToday).toHaveBeenCalled()
  })

  it("llama a onPrev al hacer clic en el botón anterior", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[1])
    expect(defaultProps.onPrev).toHaveBeenCalled()
  })

  it("llama a onNext al hacer clic en el botón siguiente", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[2])
    expect(defaultProps.onNext).toHaveBeenCalled()
  })
})

describe("CalendarToolbar — cambio de vista", () => {
  it("llama a onViewChange con 'week' al hacer clic en Semana", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    await user.click(screen.getByText("Semana"))
    expect(defaultProps.onViewChange).toHaveBeenCalledWith("week")
  })

  it("llama a onViewChange con 'month' al hacer clic en Mes", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    await user.click(screen.getByText("Mes"))
    expect(defaultProps.onViewChange).toHaveBeenCalledWith("month")
  })

  it("llama a onViewChange con 'chairs' al hacer clic en Equipo", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} canToggle />)
    await user.click(screen.getByText("Equipo"))
    expect(defaultProps.onViewChange).toHaveBeenCalledWith("chairs")
  })

  it("llama a onViewChange con 'day' al hacer clic en Día", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} />)
    await user.click(screen.getByText("Día"))
    expect(defaultProps.onViewChange).toHaveBeenCalledWith("day")
  })

  it("la vista activa tiene bg-foreground", () => {
    render(<CalendarToolbar {...defaultProps} view="week" />)
    const weekBtn = screen.getByText("Semana")
    expect(weekBtn.className).toContain("bg-foreground")
  })

  it("una vista inactiva no tiene bg-foreground", () => {
    render(<CalendarToolbar {...defaultProps} view="week" />)
    const dayBtn = screen.getByText("Día")
    expect(dayBtn.className).not.toContain("bg-foreground")
  })
})

describe("CalendarToolbar — toggle mis reservas", () => {
  it("no muestra el botón de toggle cuando canToggle=false", () => {
    render(<CalendarToolbar {...defaultProps} canToggle={false} />)
    expect(screen.queryByText("Todas")).not.toBeInTheDocument()
    expect(screen.queryByText(/Mis reservas/)).not.toBeInTheDocument()
  })

  it("muestra 'Todas' cuando canToggle=true y showOnlyMine=false", () => {
    render(<CalendarToolbar {...defaultProps} canToggle showOnlyMine={false} />)
    expect(screen.getByText("Todas")).toBeInTheDocument()
  })

  it("muestra 'Mis reservas' cuando canToggle=true y showOnlyMine=true", () => {
    render(<CalendarToolbar {...defaultProps} canToggle showOnlyMine />)
    expect(screen.getByText("Mis reservas")).toBeInTheDocument()
  })

  it("llama a onToggleOnlyMine al hacer clic en el toggle", async () => {
    const user = userEvent.setup()
    render(<CalendarToolbar {...defaultProps} canToggle showOnlyMine={false} />)
    await user.click(screen.getByText("Todas"))
    expect(defaultProps.onToggleOnlyMine).toHaveBeenCalled()
  })
})
