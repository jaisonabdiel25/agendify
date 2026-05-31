"use client"

import { PieChart, Pie, Cell } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { StatusSlice, BookingStatus } from "./types"

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#10b981",
  COMPLETED: "#3b82f6",
  CANCELLED: "#9ca3af",
  NO_SHOW: "#ef4444",
}

const chartConfig: ChartConfig = {
  PENDING: { label: "Pendiente", color: STATUS_COLOR.PENDING },
  CONFIRMED: { label: "Confirmada", color: STATUS_COLOR.CONFIRMED },
  COMPLETED: { label: "Completada", color: STATUS_COLOR.COMPLETED },
  CANCELLED: { label: "Cancelada", color: STATUS_COLOR.CANCELLED },
  NO_SHOW: { label: "No asistió", color: STATUS_COLOR.NO_SHOW },
}

interface StatusChartProps {
  data: StatusSlice[]
}

export function StatusChart({ data }: StatusChartProps) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de reservas</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sin reservas en este período
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-65 w-full">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
