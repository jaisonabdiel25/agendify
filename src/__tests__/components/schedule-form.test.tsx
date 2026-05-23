/**
 * @jest-environment jsdom
 */

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ScheduleForm } from "@/components/modules/schedule/schedule-form"
import { toast } from "sonner"

const mockToast = toast as { success: jest.Mock; error: jest.Mock }

const chair = {
  id: "chair-1",
  name: "Silla A",
  schedules: [],
}

const chairWithSchedules = {
  id: "chair-1",
  name: "Silla A",
  schedules: [
    { dayOfWeek: 1, isActive: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 5, isActive: true, openTime: "10:00", closeTime: "17:00" },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("ScheduleForm — renderizado", () => {
  it("muestra todos los días de la semana", () => {
    render(<ScheduleForm chair={chair} />)
    expect(screen.getByText("Lunes")).toBeInTheDocument()
    expect(screen.getByText("Martes")).toBeInTheDocument()
    expect(screen.getByText("Miércoles")).toBeInTheDocument()
    expect(screen.getByText("Jueves")).toBeInTheDocument()
    expect(screen.getByText("Viernes")).toBeInTheDocument()
    expect(screen.getByText("Sábado")).toBeInTheDocument()
    expect(screen.getByText("Domingo")).toBeInTheDocument()
  })

  it("muestra 7 switches (uno por día)", () => {
    render(<ScheduleForm chair={chair} />)
    const toggles = screen.getAllByRole("switch")
    expect(toggles).toHaveLength(7)
  })

  it("muestra todos los días como cerrados cuando no hay schedules", () => {
    render(<ScheduleForm chair={chair} />)
    const closedLabels = screen.getAllByText("Cerrado")
    expect(closedLabels).toHaveLength(7)
  })

  it("muestra el botón Guardar cambios", () => {
    render(<ScheduleForm chair={chair} />)
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })
})

describe("ScheduleForm — carga de schedules existentes", () => {
  it("muestra los días activos como Abierto", () => {
    render(<ScheduleForm chair={chairWithSchedules} />)
    const openLabels = screen.getAllByText("Abierto")
    expect(openLabels).toHaveLength(2)
  })

  it("carga el openTime del schedule existente", () => {
    render(<ScheduleForm chair={chairWithSchedules} />)
    const timeInputs = screen.getAllByDisplayValue("09:00")
    expect(timeInputs.length).toBeGreaterThanOrEqual(1)
  })
})

describe("ScheduleForm — toggle de días", () => {
  it("activa un día al hacer clic en el toggle", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chair} />)
    const toggles = screen.getAllByRole("switch")
    await user.click(toggles[0])
    expect(screen.getByText("Abierto")).toBeInTheDocument()
  })

  it("el toggle cambia aria-checked al hacer clic", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chair} />)
    const toggle = screen.getAllByRole("switch")[0]
    expect(toggle).toHaveAttribute("aria-checked", "false")
    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "true")
  })

  it("desactiva un día activo al hacer clic de nuevo", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chairWithSchedules} />)
    const toggles = screen.getAllByRole("switch")
    // Lunes (índice 0) está activo
    await user.click(toggles[0])
    const openLabels = screen.queryAllByText("Abierto")
    expect(openLabels).toHaveLength(1)
  })
})

describe("ScheduleForm — actualizar horarios", () => {
  it("actualiza el openTime al cambiar el input de hora de apertura", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chairWithSchedules} />)
    const timeInputs = screen.getAllByDisplayValue("09:00")
    await user.clear(timeInputs[0])
    await user.type(timeInputs[0], "08:00")
    const updated = screen.queryAllByDisplayValue("08:00")
    expect(updated.length).toBeGreaterThanOrEqual(1)
  })

  it("actualiza el closeTime al cambiar el input de hora de cierre", async () => {
    const { container } = render(<ScheduleForm chair={chairWithSchedules} />)
    const timeInputs = container.querySelectorAll('input[type="time"]')
    const closeTimeInput = timeInputs[1] as HTMLInputElement
    fireEvent.change(closeTimeInput, { target: { value: "20:00" } })
    expect(closeTimeInput.value).toBe("20:00")
  })
})

describe("ScheduleForm — guardar", () => {
  it("llama fetch PUT con los schedules al guardar", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chair} />)
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/schedule",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("schedules"),
        })
      )
    })
  })

  it("muestra toast de éxito al guardar correctamente", async () => {
    const user = userEvent.setup()
    render(<ScheduleForm chair={chair} />)
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Cronograma guardado")
    })
  })

  it("muestra toast de error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al guardar el cronograma" }),
    } as Response)
    const user = userEvent.setup()
    render(<ScheduleForm chair={chair} />)
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })
})
