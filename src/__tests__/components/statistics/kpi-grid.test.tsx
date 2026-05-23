/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { KpiGrid } from "@/components/modules/statistics/kpi-grid"
import type { KpiData } from "@/components/modules/statistics/types"

const baseKpi: KpiData = {
  totalBookings: 42,
  revenue: "1250.00",
  avgTicket: "30.00",
  cancellationRate: 15,
}

describe("KpiGrid — títulos y subtítulos", () => {
  it("muestra los cuatro títulos de tarjeta", () => {
    render(<KpiGrid data={baseKpi} />)
    expect(screen.getByText("Reservas")).toBeInTheDocument()
    expect(screen.getByText("Ingresos")).toBeInTheDocument()
    expect(screen.getByText("Ticket promedio")).toBeInTheDocument()
    expect(screen.getByText("Cancelaciones")).toBeInTheDocument()
  })

  it("muestra los subtítulos descriptivos", () => {
    render(<KpiGrid data={baseKpi} />)
    expect(screen.getByText("en el período")).toBeInTheDocument()
    expect(screen.getByText("confirmadas + completadas")).toBeInTheDocument()
    expect(screen.getByText("por reserva")).toBeInTheDocument()
    expect(screen.getByText("del total de reservas")).toBeInTheDocument()
  })
})

describe("KpiGrid — valores", () => {
  it("muestra el total de reservas como número", () => {
    render(<KpiGrid data={baseKpi} />)
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("muestra la tasa de cancelación con signo de porcentaje", () => {
    render(<KpiGrid data={baseKpi} />)
    expect(screen.getByText("15%")).toBeInTheDocument()
  })

  it("muestra los ingresos formateados como moneda", () => {
    render(<KpiGrid data={baseKpi} />)
    // Verifica que el valor numérico esté presente independiente del símbolo de moneda
    const content = document.body.textContent ?? ""
    expect(content).toMatch(/1[,.]250/)
  })

  it("muestra el ticket promedio formateado como moneda", () => {
    render(<KpiGrid data={baseKpi} />)
    const content = document.body.textContent ?? ""
    expect(content).toMatch(/30/)
  })
})

describe("KpiGrid — valores en cero", () => {
  const emptyKpi: KpiData = {
    totalBookings: 0,
    revenue: "0.00",
    avgTicket: "0.00",
    cancellationRate: 0,
  }

  it("muestra 0 reservas", () => {
    render(<KpiGrid data={emptyKpi} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("muestra 0% de cancelaciones", () => {
    render(<KpiGrid data={emptyKpi} />)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })
})

describe("KpiGrid — valores altos", () => {
  it("muestra grandes cantidades correctamente", () => {
    render(
      <KpiGrid
        data={{ totalBookings: 9999, revenue: "99999.99", avgTicket: "10.01", cancellationRate: 100 }}
      />
    )
    expect(screen.getByText("9999")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })
})
