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
  it("muestra el mes y año formateado", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByText(/junio 2025/i)).toBeInTheDocument()
  })

  it("muestra el botón mes anterior", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes anterior")).toBeInTheDocument()
  })

  it("muestra el botón mes siguiente", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes siguiente")).toBeInTheDocument()
  })
})

describe("PeriodNav — navegación", () => {
  it("navega al mes anterior al hacer clic", async () => {
    const user = userEvent.setup()
    render(<PeriodNav currentMonth="2025-06" />)
    await user.click(screen.getByLabelText("Mes anterior"))
    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-05")
  })

  it("navega al mes siguiente al hacer clic", async () => {
    const user = userEvent.setup()
    render(<PeriodNav currentMonth="2024-12" />)
    await user.click(screen.getByLabelText("Mes siguiente"))
    expect(mockPush).toHaveBeenCalledWith("/statistics?month=2025-01")
  })

  it("deshabilita el botón siguiente cuando es el mes actual o futuro", () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    render(<PeriodNav currentMonth={currentMonth} />)
    expect(screen.getByLabelText("Mes siguiente")).toBeDisabled()
  })

  it("el botón anterior siempre está habilitado", () => {
    render(<PeriodNav currentMonth="2025-06" />)
    expect(screen.getByLabelText("Mes anterior")).not.toBeDisabled()
  })
})
