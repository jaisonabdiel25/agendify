/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { KpiGrid } from "@/components/modules/statistics/kpi-grid"

const defaultData = {
  totalBookings: 42,
  revenue: "1250.00",
  avgTicket: "29.76",
  cancellationRate: 10,
}

describe("KpiGrid — renderizado", () => {
  it("muestra el total de reservas", () => {
    render(<KpiGrid data={defaultData} />)
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("muestra la tarjeta de ingresos", () => {
    render(<KpiGrid data={defaultData} />)
    expect(screen.getByText("Ingresos")).toBeInTheDocument()
  })

  it("muestra la tarjeta de ticket promedio", () => {
    render(<KpiGrid data={defaultData} />)
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument()
  })

  it("muestra el porcentaje de cancelaciones", () => {
    render(<KpiGrid data={defaultData} />)
    expect(screen.getByText("10%")).toBeInTheDocument()
  })

  it("muestra las 4 tarjetas KPI", () => {
    render(<KpiGrid data={defaultData} />)
    expect(screen.getByText("Reservas")).toBeInTheDocument()
    expect(screen.getByText("Ingresos")).toBeInTheDocument()
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument()
    expect(screen.getByText("Cancelaciones")).toBeInTheDocument()
  })

  it("formatea los ingresos como moneda USD", () => {
    render(<KpiGrid data={{ ...defaultData, revenue: "1250.00" }} />)
    expect(screen.getByText(/1,250/)).toBeInTheDocument()
  })

  it("muestra 0% cuando cancellationRate es 0", () => {
    render(<KpiGrid data={{ ...defaultData, cancellationRate: 0 }} />)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })
})
