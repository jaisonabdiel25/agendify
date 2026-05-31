"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ChairPoint } from "./types"

const chartConfig: ChartConfig = {
  count: {
    label: "Reservas",
    color: "hsl(var(--foreground))",
  },
}

interface ChairChartProps {
  data: ChairPoint[]
}

export function ChairChart({ data }: ChairChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utilización por puesto</CardTitle>
          <CardDescription>Reservas por colaborador</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sin reservas en este período
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilización por puesto</CardTitle>
        <CardDescription>Reservas por colaborador</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-65 w-full">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 24 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              height={48}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="count"
              fill="hsl(var(--foreground))"
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
