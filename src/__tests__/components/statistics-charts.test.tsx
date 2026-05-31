/**
 * @jest-environment jsdom
 */

jest.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div className={className} style={style}>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
  ChartLegend: () => null,
  ChartLegendContent: () => null,
  ChartStyle: () => null,
}))

import React from "react"
import { render, screen } from "@testing-library/react"
import { ChairChart } from "@/components/modules/statistics/chair-chart"
import { DailyTrend } from "@/components/modules/statistics/daily-trend"
import { MonthlyTrend } from "@/components/modules/statistics/monthly-trend"
import { ServiceChart } from "@/components/modules/statistics/service-chart"
import { StatusChart } from "@/components/modules/statistics/status-chart"
import type { ChairPoint, DailyPoint, MonthlyPoint, ServicePoint, StatusSlice } from "@/components/modules/statistics/types"

// ─── ChairChart ───────────────────────────────────────────────────────────────

describe("ChairChart — estado vacío", () => {
  it("muestra título Utilización por puesto", () => {
    render(<ChairChart data={[]} />)
    expect(screen.getByText("Utilización por puesto")).toBeInTheDocument()
  })

  it("muestra mensaje sin reservas cuando data está vacía", () => {
    render(<ChairChart data={[]} />)
    expect(screen.getByText("Sin reservas en este período")).toBeInTheDocument()
  })
})

describe("ChairChart — con datos", () => {
  const data: ChairPoint[] = [
    { chairId: "chair-1", name: "Silla A", count: 5 },
    { chairId: "chair-2", name: "Silla B", count: 3 },
  ]

  it("renderiza el gráfico cuando hay datos", () => {
    render(<ChairChart data={data} />)
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("no muestra mensaje de sin reservas cuando hay datos", () => {
    render(<ChairChart data={data} />)
    expect(screen.queryByText("Sin reservas en este período")).not.toBeInTheDocument()
  })

  it("muestra el título con datos", () => {
    render(<ChairChart data={data} />)
    expect(screen.getByText("Reservas por colaborador")).toBeInTheDocument()
  })
})

// ─── DailyTrend ───────────────────────────────────────────────────────────────

describe("DailyTrend — estado vacío", () => {
  const emptyData: DailyPoint[] = [
    { day: 1, label: "1", count: 0 },
    { day: 2, label: "2", count: 0 },
  ]

  it("muestra título Reservas por día", () => {
    render(<DailyTrend data={emptyData} />)
    expect(screen.getByText("Reservas por día")).toBeInTheDocument()
  })

  it("muestra mensaje sin reservas cuando todos los counts son 0", () => {
    render(<DailyTrend data={emptyData} />)
    expect(screen.getByText("Sin reservas en este período")).toBeInTheDocument()
  })
})

describe("DailyTrend — con datos", () => {
  const data: DailyPoint[] = [
    { day: 1, label: "1", count: 0 },
    { day: 2, label: "2", count: 4 },
    { day: 3, label: "3", count: 2 },
  ]

  it("renderiza el gráfico cuando algún día tiene reservas", () => {
    render(<DailyTrend data={data} />)
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("no muestra mensaje de sin reservas cuando hay datos", () => {
    render(<DailyTrend data={data} />)
    expect(screen.queryByText("Sin reservas en este período")).not.toBeInTheDocument()
  })
})

// ─── MonthlyTrend ─────────────────────────────────────────────────────────────

describe("MonthlyTrend — estado vacío", () => {
  const emptyData: MonthlyPoint[] = [
    { month: "2025-01", label: "Ene", count: 0 },
    { month: "2025-02", label: "Feb", count: 0 },
  ]

  it("muestra título Tendencia mensual", () => {
    render(<MonthlyTrend data={emptyData} />)
    expect(screen.getByText("Tendencia mensual")).toBeInTheDocument()
  })

  it("muestra mensaje sin reservas cuando todos los counts son 0", () => {
    render(<MonthlyTrend data={emptyData} />)
    expect(screen.getByText("Sin reservas en los últimos 12 meses")).toBeInTheDocument()
  })
})

describe("MonthlyTrend — con datos", () => {
  const data: MonthlyPoint[] = [
    { month: "2025-01", label: "Ene", count: 0 },
    { month: "2025-02", label: "Feb", count: 10 },
    { month: "2025-03", label: "Mar", count: 8 },
  ]

  it("renderiza el gráfico cuando hay datos", () => {
    render(<MonthlyTrend data={data} />)
    expect(screen.getByTestId("area-chart")).toBeInTheDocument()
  })

  it("no muestra mensaje de sin reservas cuando hay datos", () => {
    render(<MonthlyTrend data={data} />)
    expect(screen.queryByText("Sin reservas en los últimos 12 meses")).not.toBeInTheDocument()
  })

  it("muestra la descripción del período", () => {
    render(<MonthlyTrend data={data} />)
    expect(screen.getByText("Reservas de los últimos 12 meses")).toBeInTheDocument()
  })
})

// ─── ServiceChart ─────────────────────────────────────────────────────────────

describe("ServiceChart — estado vacío", () => {
  it("muestra título Servicios más solicitados", () => {
    render(<ServiceChart data={[]} />)
    expect(screen.getByText("Servicios más solicitados")).toBeInTheDocument()
  })

  it("muestra mensaje sin reservas cuando data está vacía", () => {
    render(<ServiceChart data={[]} />)
    expect(screen.getByText("Sin reservas en este período")).toBeInTheDocument()
  })
})

describe("ServiceChart — con datos", () => {
  const data: ServicePoint[] = [
    { serviceId: "srv-1", name: "Corte clásico", color: "#6366f1", count: 10 },
    { serviceId: "srv-2", name: "Coloración", color: "#f59e0b", count: 6 },
    { serviceId: "srv-3", name: "Barba", color: "#10b981", count: 4 },
  ]

  it("renderiza el gráfico cuando hay datos", () => {
    render(<ServiceChart data={data} />)
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
  })

  it("muestra el top en la descripción", () => {
    render(<ServiceChart data={data} />)
    expect(screen.getByText(/Top 3 por cantidad/i)).toBeInTheDocument()
  })

  it("no muestra mensaje de sin reservas", () => {
    render(<ServiceChart data={data} />)
    expect(screen.queryByText("Sin reservas en este período")).not.toBeInTheDocument()
  })
})

// ─── StatusChart ──────────────────────────────────────────────────────────────

describe("StatusChart — estado vacío", () => {
  const emptyData: StatusSlice[] = [
    { status: "PENDING", count: 0 },
    { status: "CONFIRMED", count: 0 },
    { status: "COMPLETED", count: 0 },
    { status: "CANCELLED", count: 0 },
    { status: "NO_SHOW", count: 0 },
  ]

  it("muestra título Estado de reservas", () => {
    render(<StatusChart data={emptyData} />)
    expect(screen.getByText("Estado de reservas")).toBeInTheDocument()
  })

  it("muestra mensaje sin reservas cuando todos los counts son 0", () => {
    render(<StatusChart data={emptyData} />)
    expect(screen.getByText("Sin reservas en este período")).toBeInTheDocument()
  })
})

describe("StatusChart — con datos", () => {
  const data: StatusSlice[] = [
    { status: "PENDING", count: 2 },
    { status: "CONFIRMED", count: 5 },
    { status: "COMPLETED", count: 8 },
    { status: "CANCELLED", count: 1 },
    { status: "NO_SHOW", count: 0 },
  ]

  it("renderiza el gráfico de pastel cuando hay datos", () => {
    render(<StatusChart data={data} />)
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
  })

  it("no muestra mensaje de sin reservas cuando hay datos", () => {
    render(<StatusChart data={data} />)
    expect(screen.queryByText("Sin reservas en este período")).not.toBeInTheDocument()
  })
})
