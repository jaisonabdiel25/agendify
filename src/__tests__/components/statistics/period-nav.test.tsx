/**
 * @jest-environment jsdom
 */

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PeriodNav } from "@/components/modules/statistics/period-nav"

beforeEach(() => {
  jest.clearAllMocks()
  // Fijar fecha actual: junio 2025
  jest.useFakeTimers()
  jest.setSystemTime(new Date("2025-06-15T12:00:00.000Z"))
})

afterEach(() => {
  jest.useRealTimers()
})

describe("PeriodNav — visualización del mes", () => {
  it("muestra el nombre del mes actual en español en minúsculas", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByText(/junio 2025/i)).toBeInTheDocument()
  })

  it("muestra el mes correcto para un mes anterior", () => {
    render(<PeriodNav currentMonth="2025-01" />)
    expect(screen.getByText(/enero 2025/i)).toBeInTheDocument()
  })

  it("muestra los botones de navegación", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes anterior")).toBeInTheDocument()
    expect(screen.getByLabelText("Mes siguiente")).toBeInTheDocument()
  })
})

describe("PeriodNav — navegación", () => {
  it("navega al mes anterior al hacer clic en el botón izquierdo", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" />)

    await user.click(screen.getByLabelText("Mes anterior"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-05")
  })

  it("navega al mes siguiente al hacer clic en el botón derecho", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-05" />)

    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-06")
  })

  it("navega correctamente entre años (diciembre → enero)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2024-12" />)

    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-01")
  })

  it("navega correctamente entre años (enero → diciembre)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-01" />)

    await user.click(screen.getByLabelText("Mes anterior"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2024-12")
  })
})

describe("PeriodNav — botón mes siguiente deshabilitado", () => {
  it("deshabilita el botón siguiente cuando currentMonth es el mes actual", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes siguiente")).toBeDisabled()
  })

  it("no llama a router.push al hacer clic en el botón siguiente deshabilitado", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" />)

    // El botón tiene pointer-events-none, userEvent no debe disparar el handler
    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("habilita el botón siguiente para meses anteriores al actual", () => {
    render(<PeriodNav currentMonth="2025-05" />)
    expect(screen.getByLabelText("Mes siguiente")).not.toBeDisabled()
  })

  it("habilita el botón siguiente para meses del año anterior", () => {
    render(<PeriodNav currentMonth="2024-06" />)
    expect(screen.getByLabelText("Mes siguiente")).not.toBeDisabled()
  })
})

describe("PeriodNav — botón mes anterior", () => {
  it("siempre está habilitado independientemente del mes", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes anterior")).not.toBeDisabled()
  })

  it("está habilitado para meses muy anteriores", () => {
    render(<PeriodNav currentMonth="2020-01" />)
    expect(screen.getByLabelText("Mes anterior")).not.toBeDisabled()
  })
})
