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
  jest.useFakeTimers()
  jest.setSystemTime(new Date("2025-06-15T12:00:00.000Z"))
})

afterEach(() => {
  jest.useRealTimers()
})

describe("PeriodNav — visualización del mes", () => {
  it("muestra el nombre del mes actual en español en minúsculas", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByText(/junio 2025/i)).toBeInTheDocument()
  })

  it("muestra el mes correcto para un mes anterior", () => {
    render(<PeriodNav currentMonth="2025-01" view="month" />)
    expect(screen.getByText(/enero 2025/i)).toBeInTheDocument()
  })

  it("muestra los botones de navegación en vista mensual", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByLabelText("Mes anterior")).toBeInTheDocument()
    expect(screen.getByLabelText("Mes siguiente")).toBeInTheDocument()
  })
})

describe("PeriodNav — toggle de vista", () => {
  it("muestra los botones Por mes y Global", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByText("Por mes")).toBeInTheDocument()
    expect(screen.getByText("Global")).toBeInTheDocument()
  })

  it("oculta la navegación de meses en vista global", () => {
    render(<PeriodNav currentMonth="2025-06" view="all" />)
    expect(screen.queryByLabelText("Mes anterior")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Mes siguiente")).not.toBeInTheDocument()
  })

  it("navega a vista global al hacer clic en Global", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" view="month" />)

    await user.click(screen.getByText("Global"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?view=all")
  })

  it("navega a vista mensual al hacer clic en Por mes desde vista global", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" view="all" />)

    await user.click(screen.getByText("Por mes"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-06&view=month")
  })
})

describe("PeriodNav — navegación mensual", () => {
  it("navega al mes anterior al hacer clic en el botón izquierdo", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" view="month" />)

    await user.click(screen.getByLabelText("Mes anterior"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-05&view=month")
  })

  it("navega al mes siguiente al hacer clic en el botón derecho", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-05" view="month" />)

    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-06&view=month")
  })

  it("navega correctamente entre años (diciembre → enero)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2024-12" view="month" />)

    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-01&view=month")
  })

  it("navega correctamente entre años (enero → diciembre)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-01" view="month" />)

    await user.click(screen.getByLabelText("Mes anterior"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2024-12&view=month")
  })

  it("permite navegar al mes siguiente desde el mes actual", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<PeriodNav currentMonth="2025-06" view="month" />)

    expect(screen.getByLabelText("Mes siguiente")).not.toBeDisabled()
    await user.click(screen.getByLabelText("Mes siguiente"))

    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-07&view=month")
  })

  it("el botón anterior siempre está habilitado", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByLabelText("Mes anterior")).not.toBeDisabled()
  })
})
