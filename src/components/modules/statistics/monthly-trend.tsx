"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MonthlyPoint } from "./types"

const chartConfig: ChartConfig = {
  count: {
    label: "Reservas",
    color: "hsl(var(--foreground))",
  },
}

interface MonthlyTrendProps {
  data: MonthlyPoint[]
  description?: string
}

export function MonthlyTrend({ data, description = "Reservas de los últimos 12 meses" }: MonthlyTrendProps) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia mensual</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sin reservas en los últimos 12 meses
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-55 w-full">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
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
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill="url(#monthlyGrad)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
