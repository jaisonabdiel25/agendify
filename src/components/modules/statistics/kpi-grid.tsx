import { CalendarDays, DollarSign, TrendingUp, XCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { KpiData } from "./types"

const fmt = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" })

interface KpiGridProps {
  data: KpiData
}

export function KpiGrid({ data }: KpiGridProps) {
  const items = [
    {
      title: "Reservas",
      value: data.totalBookings.toString(),
      icon: CalendarDays,
      sub: "en el período",
    },
    {
      title: "Ingresos",
      value: fmt.format(parseFloat(data.revenue)),
      icon: DollarSign,
      sub: "confirmadas + completadas",
    },
    {
      title: "Ticket promedio",
      value: fmt.format(parseFloat(data.avgTicket)),
      icon: TrendingUp,
      sub: "por reserva",
    },
    {
      title: "Cancelaciones",
      value: `${data.cancellationRate}%`,
      icon: XCircle,
      sub: "del total de reservas",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
