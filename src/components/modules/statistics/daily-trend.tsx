"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DailyPoint } from "./types"

const chartConfig: ChartConfig = {
  count: {
    label: "Reservas",
    color: "hsl(var(--foreground))",
  },
}

interface DailyTrendProps {
  data: DailyPoint[]
}

export function DailyTrend({ data }: DailyTrendProps) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas por día</CardTitle>
        <CardDescription>Distribución diaria del mes</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sin reservas en este período
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-65 w-full">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={4}
                axisLine={false}
                tickLine={false}
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
                maxBarSize={20}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
