"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { ServicePoint } from "./types"

interface ServiceChartProps {
  data: ServicePoint[]
}

export function ServiceChart({ data }: ServiceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Servicios más solicitados</CardTitle>
          <CardDescription>Top servicios por reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Sin reservas en este período
          </p>
        </CardContent>
      </Card>
    )
  }

  const height = Math.max(180, data.length * 40)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios más solicitados</CardTitle>
        <CardDescription>Top {data.length} por cantidad de reservas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "hsl(var(--card-foreground))" }}
              itemStyle={{ color: "hsl(var(--card-foreground))" }}
              formatter={(value: unknown) => [String(value ?? ""), "Reservas"]}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={20}>
              {data.map((entry) => (
                <Cell key={entry.serviceId} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
