/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PeriodNav } from "@/components/modules/statistics/period-nav"
import { useRouter } from "next/navigation"

const mockPush = jest.fn()
const routerMock = useRouter as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  routerMock.mockReturnValue({ push: mockPush })
})

describe("PeriodNav — renderizado", () => {
  it("muestra el mes y año formateado en vista mensual", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByText(/junio 2025/i)).toBeInTheDocument()
  })

  it("muestra el botón mes anterior en vista mensual", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByLabelText("Mes anterior")).toBeInTheDocument()
  })

  it("muestra el botón mes siguiente en vista mensual", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByLabelText("Mes siguiente")).toBeInTheDocument()
  })

  it("no muestra navegación de meses en vista global", () => {
    render(<PeriodNav currentMonth="2025-06" view="all" />)
    expect(screen.queryByLabelText("Mes anterior")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Mes siguiente")).not.toBeInTheDocument()
  })
})

describe("PeriodNav — navegación", () => {
  it("navega al mes anterior al hacer clic", async () => {
    const user = userEvent.setup()
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    await user.click(screen.getByLabelText("Mes anterior"))
    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-05&view=month")
  })

  it("navega al mes siguiente al hacer clic", async () => {
    const user = userEvent.setup()
    render(<PeriodNav currentMonth="2024-12" view="month" />)
    await user.click(screen.getByLabelText("Mes siguiente"))
    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-01&view=month")
  })

  it("permite navegar al mes siguiente desde el mes actual", async () => {
    const user = userEvent.setup()
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    render(<PeriodNav currentMonth={currentMonth} view="month" />)
    expect(screen.getByLabelText("Mes siguiente")).not.toBeDisabled()
    await user.click(screen.getByLabelText("Mes siguiente"))
    expect(mockPush).toHaveBeenCalled()
  })

  it("el botón anterior siempre está habilitado", () => {
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    expect(screen.getByLabelText("Mes anterior")).not.toBeDisabled()
  })

  it("navega a vista global al hacer clic en Global", async () => {
    const user = userEvent.setup()
    render(<PeriodNav currentMonth="2025-06" view="month" />)
    await user.click(screen.getByText("Global"))
    expect(mockPush).toHaveBeenCalledWith("/statistics?view=all")
  })
})
