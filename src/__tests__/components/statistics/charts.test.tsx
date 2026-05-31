/**
 * @jest-environment jsdom
 */

jest.mock("recharts", () => {
  const R = jest.requireActual("react") as {
    createElement: (type: unknown, props: null, ...children: unknown[]) => unknown
    Fragment: symbol
  }
  const pass = (children: unknown) => R.createElement(R.Fragment, null, children)
  return {
    ResponsiveContainer: ({ children }: { children: unknown }) => pass(children),
    PieChart: ({ children }: { children: unknown }) => pass(children),
    BarChart: ({ children }: { children: unknown }) => pass(children),
    AreaChart: () => null,
    Pie: () => null,
    Bar: () => null,
    Area: () => null,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

jest.mock("@/components/ui/chart", () => {
  const R = jest.requireActual("react") as {
    createElement: (type: unknown, props: null, ...children: unknown[]) => unknown
    Fragment: symbol
  }
  return {
    ChartContainer: ({ children }: { children: unknown }) =>
      R.createElement(R.Fragment, null, children),
    ChartTooltip: () => null,
    ChartTooltipContent: () => null,
    ChartLegend: () => null,
    ChartLegendContent: () => null,
    ChartStyle: () => null,
  }
})

import { render, screen } from "@testing-library/react"
import { StatusChart } from "@/components/modules/statistics/status-chart"
import { DailyTrend } from "@/components/modules/statistics/daily-trend"
import { MonthlyTrend } from "@/components/modules/statistics/monthly-trend"
import { ServiceChart } from "@/components/modules/statistics/service-chart"
import { ChairChart } from "@/components/modules/statistics/chair-chart"
import type {
  StatusSlice,
  DailyPoint,
  MonthlyPoint,
  ServicePoint,
  ChairPoint,
} from "@/components/modules/statistics/types"

// ─── StatusChart ──────────────────────────────────────────────────────────────

describe("StatusChart", () => {
  it("muestra el título siempre", () => {
    render(<StatusChart data={[]} />)
    expect(screen.getByText("Estado de reservas")).toBeInTheDocument()
  })

  it("muestra estado vacío cuando el array está vacío", () => {
    render(<StatusChart data={[]} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("muestra estado vacío cuando todos los conteos son 0", () => {
    const data: StatusSlice[] = [
      { status: "CONFIRMED", count: 0 },
      { status: "CANCELLED", count: 0 },
    ]
    render(<StatusChart data={data} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("no muestra estado vacío cuando hay al menos una reserva", () => {
    const data: StatusSlice[] = [
      { status: "CONFIRMED", count: 5 },
      { status: "CANCELLED", count: 0 },
    ]
    render(<StatusChart data={data} />)
    expect(screen.queryByText(/Sin reservas en este período/i)).not.toBeInTheDocument()
  })
})

// ─── DailyTrend ───────────────────────────────────────────────────────────────

describe("DailyTrend", () => {
  it("muestra el título siempre", () => {
    render(<DailyTrend data={[]} />)
    expect(screen.getByText("Reservas por día")).toBeInTheDocument()
  })

  it("muestra la descripción siempre", () => {
    render(<DailyTrend data={[]} />)
    expect(screen.getByText("Distribución diaria del mes")).toBeInTheDocument()
  })

  it("muestra estado vacío cuando todos los días tienen count 0", () => {
    const data: DailyPoint[] = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      label: String(i + 1),
      count: 0,
    }))
    render(<DailyTrend data={data} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("no muestra estado vacío cuando hay reservas en algún día", () => {
    const data: DailyPoint[] = [
      { day: 1, label: "1", count: 3 },
      { day: 2, label: "2", count: 0 },
    ]
    render(<DailyTrend data={data} />)
    expect(screen.queryByText(/Sin reservas en este período/i)).not.toBeInTheDocument()
  })
})

// ─── MonthlyTrend ─────────────────────────────────────────────────────────────

describe("MonthlyTrend", () => {
  it("muestra el título siempre", () => {
    render(<MonthlyTrend data={[]} />)
    expect(screen.getByText("Tendencia mensual")).toBeInTheDocument()
  })

  it("muestra la descripción siempre", () => {
    render(<MonthlyTrend data={[]} />)
    expect(screen.getByText("Reservas de los últimos 12 meses")).toBeInTheDocument()
  })

  it("muestra estado vacío específico cuando no hay datos históricos", () => {
    const data: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(i + 1).padStart(2, "0")}`,
      label: "mes",
      count: 0,
    }))
    render(<MonthlyTrend data={data} />)
    expect(screen.getByText(/Sin reservas en los últimos 12 meses/i)).toBeInTheDocument()
  })

  it("no muestra estado vacío cuando hay al menos un mes con reservas", () => {
    const data: MonthlyPoint[] = [
      { month: "2025-01", label: "ene", count: 10 },
      { month: "2025-02", label: "feb", count: 0 },
    ]
    render(<MonthlyTrend data={data} />)
    expect(screen.queryByText(/Sin reservas en los últimos 12 meses/i)).not.toBeInTheDocument()
  })
})

// ─── ServiceChart ─────────────────────────────────────────────────────────────

describe("ServiceChart", () => {
  it("muestra el título siempre", () => {
    render(<ServiceChart data={[]} />)
    expect(screen.getByText("Servicios más solicitados")).toBeInTheDocument()
  })

  it("muestra estado vacío cuando el array está vacío", () => {
    render(<ServiceChart data={[]} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("muestra la cantidad de servicios en la descripción cuando hay datos", () => {
    const data: ServicePoint[] = [
      { serviceId: "s1", name: "Corte", color: "#6366f1", count: 5 },
      { serviceId: "s2", name: "Tinte", color: "#10b981", count: 3 },
    ]
    render(<ServiceChart data={data} />)
    expect(screen.getByText("Top 2 por cantidad de reservas")).toBeInTheDocument()
  })

  it("no muestra estado vacío cuando hay servicios (aunque count sea 0)", () => {
    const data: ServicePoint[] = [
      { serviceId: "s1", name: "Corte", color: "#6366f1", count: 0 },
    ]
    render(<ServiceChart data={data} />)
    expect(screen.queryByText(/Sin reservas en este período/i)).not.toBeInTheDocument()
  })
})

// ─── ChairChart ───────────────────────────────────────────────────────────────

describe("ChairChart", () => {
  it("muestra el título siempre", () => {
    render(<ChairChart data={[]} />)
    expect(screen.getByText("Utilización por puesto")).toBeInTheDocument()
  })

  it("muestra la descripción siempre", () => {
    render(<ChairChart data={[]} />)
    expect(screen.getByText("Reservas por colaborador")).toBeInTheDocument()
  })

  it("muestra estado vacío cuando el array está vacío", () => {
    render(<ChairChart data={[]} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("no muestra estado vacío cuando hay puestos con datos", () => {
    const data: ChairPoint[] = [
      { chairId: "c1", name: "Silla A", count: 8 },
    ]
    render(<ChairChart data={data} />)
    expect(screen.queryByText(/Sin reservas en este período/i)).not.toBeInTheDocument()
  })
})
