import { redirect } from "next/navigation"
import {
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  getDaysInMonth,
  getDate,
  format,
} from "date-fns"
import { es } from "date-fns/locale"
import { BarChart2, CalendarDays, TrendingUp, Users } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PeriodNav } from "@/components/modules/statistics/period-nav"
import { KpiGrid } from "@/components/modules/statistics/kpi-grid"
import { StatusChart } from "@/components/modules/statistics/status-chart"
import { DailyTrend } from "@/components/modules/statistics/daily-trend"
import { MonthlyTrend } from "@/components/modules/statistics/monthly-trend"
import { ServiceChart } from "@/components/modules/statistics/service-chart"
import { ChairChart } from "@/components/modules/statistics/chair-chart"
import { TopCustomers } from "@/components/modules/statistics/top-customers"
import type {
  KpiData,
  StatusSlice,
  BookingStatus,
  DailyPoint,
  MonthlyPoint,
  ServicePoint,
  ChairPoint,
  CustomerRow,
} from "@/components/modules/statistics/types"

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id || !session.user.businessId) redirect("/login")
  if (session.user.role === "STAFF") redirect("/booking")
  const { businessId } = session.user

  const businessPlan = await prisma.business.findUnique({
    where: { id: businessId },
    select: { plan: { select: { type: true } } },
  })
  const planType = businessPlan?.plan?.type ?? "STANDARD"

  const { month: monthParam, view: viewParam } = await searchParams
  const view: "month" | "all" = viewParam === "all" ? "all" : "month"
  const isAll = view === "all"

  const ref = monthParam ? parseISO(`${monthParam}-01`) : new Date()
  const safe = isValid(ref) ? ref : new Date()
  const start = startOfMonth(safe)
  const end = endOfMonth(safe)
  const resolvedMonth = format(safe, "yyyy-MM")
  const periodLabel = isAll ? "Todos los registros" : format(safe, "MMMM yyyy", { locale: es })

  const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11))

  const [bookings, monthlyRaw] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId,
        ...(isAll ? {} : { startTime: { gte: start, lte: end } }),
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        customerId: true,
        service: { select: { id: true, name: true, color: true, price: true } },
        chair: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    isAll
      ? Promise.resolve(null)
      : prisma.booking.findMany({
          where: { businessId, startTime: { gte: twelveMonthsAgo } },
          select: { startTime: true },
        }),
  ])

  // ─── Aggregations ────────────────────────────────────────────────────────────

  const nonBillable: BookingStatus[] = ["CANCELLED", "NO_SHOW"]
  const billable = bookings.filter((b) => !nonBillable.includes(b.status as BookingStatus))
  const revenue = billable.reduce((s, b) => s + parseFloat(b.service.price.toString()), 0)

  const kpi: KpiData = {
    totalBookings: bookings.length,
    revenue: revenue.toFixed(2),
    avgTicket: billable.length ? (revenue / billable.length).toFixed(2) : "0.00",
    cancellationRate: bookings.length
      ? Math.round(
          (bookings.filter((b) => nonBillable.includes(b.status as BookingStatus)).length /
            bookings.length) *
            100,
        )
      : 0,
  }

  const statusMap = new Map<BookingStatus, number>()
  for (const b of bookings) {
    const s = b.status as BookingStatus
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1)
  }
  const statusData: StatusSlice[] = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const daysInMonth = getDaysInMonth(start)
  const dayCounts = Array<number>(daysInMonth + 1).fill(0)
  for (const b of bookings) dayCounts[getDate(new Date(b.startTime))]++
  const dailyData: DailyPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    label: String(i + 1),
    count: dayCounts[i + 1],
  }))

  let monthlyData: MonthlyPoint[]
  let monthlyTrendDescription: string

  if (isAll) {
    const allMonthlyCounts = new Map<string, number>()
    for (const b of bookings) {
      const k = format(new Date(b.startTime), "yyyy-MM")
      allMonthlyCounts.set(k, (allMonthlyCounts.get(k) ?? 0) + 1)
    }
    const sortedMonths = [...allMonthlyCounts.keys()].sort()
    monthlyData = sortedMonths.map((k) => {
      const d = parseISO(`${k}-01`)
      return { month: k, label: format(d, "MMM yy", { locale: es }), count: allMonthlyCounts.get(k) ?? 0 }
    })
    monthlyTrendDescription = "Reservas por mes — todos los registros"
  } else {
    const monthlyCounts = new Map<string, number>()
    for (const b of monthlyRaw ?? []) {
      const k = format(new Date(b.startTime), "yyyy-MM")
      monthlyCounts.set(k, (monthlyCounts.get(k) ?? 0) + 1)
    }
    monthlyData = Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(twelveMonthsAgo, i)
      const k = format(d, "yyyy-MM")
      return { month: k, label: format(d, "MMM", { locale: es }), count: monthlyCounts.get(k) ?? 0 }
    })
    monthlyTrendDescription = "Reservas de los últimos 12 meses"
  }

  const svcMap = new Map<string, { name: string; color: string; count: number }>()
  for (const b of bookings) {
    const e = svcMap.get(b.service.id)
    if (e) e.count++
    else svcMap.set(b.service.id, { name: b.service.name, color: b.service.color, count: 1 })
  }
  const serviceData: ServicePoint[] = [...svcMap.entries()]
    .map(([id, v]) => ({ serviceId: id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const chairMap = new Map<string, { name: string; count: number }>()
  for (const b of bookings) {
    const e = chairMap.get(b.chair.id)
    if (e) e.count++
    else chairMap.set(b.chair.id, { name: b.chair.name, count: 1 })
  }
  const chairData: ChairPoint[] = [...chairMap.entries()]
    .map(([id, v]) => ({ chairId: id, ...v }))
    .sort((a, b) => b.count - a.count)

  const custMap = new Map<string, { name: string; email: string | null; phone: string | null; count: number; spent: number }>()
  for (const b of bookings) {
    const e = custMap.get(b.customerId)
    const price = nonBillable.includes(b.status as BookingStatus)
      ? 0
      : parseFloat(b.service.price.toString())
    if (e) {
      e.count++
      e.spent += price
    } else {
      custMap.set(b.customerId, { name: b.customer.name, email: b.customer.email, phone: b.customer.phone, count: 1, spent: price })
    }
  }
  const customerData: CustomerRow[] = [...custMap.entries()]
    .map(([id, v]) => ({
      customerId: id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      totalBookings: v.count,
      totalSpent: v.spent.toFixed(2),
    }))
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 10)

  const isPro = planType === "PRO"

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-light text-3xl">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{periodLabel}</p>
        </div>
        <PeriodNav currentMonth={resolvedMonth} view={view} />
      </div>

      {isPro && <KpiGrid data={kpi} />}

      <div className={isPro ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" : undefined}>
        <StatusChart data={statusData} />
        {isPro && !isAll && <DailyTrend data={dailyData} />}
      </div>

      {isPro && (
        <>
          <MonthlyTrend data={monthlyData} description={monthlyTrendDescription} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ServiceChart data={serviceData} />
            <ChairChart data={chairData} />
          </div>

          <TopCustomers data={customerData} />
        </>
      )}

      {!isPro && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">Análisis avanzado disponible en Pro</p>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Desbloquea métricas detalladas para tomar mejores decisiones en tu negocio.
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: TrendingUp, label: "KPIs: ingresos, ticket promedio y cancelaciones" },
                { icon: CalendarDays, label: "Tendencia diaria y mensual de reservas" },
                { icon: BarChart2, label: "Rendimiento por servicio y por puesto" },
                { icon: Users, label: "Ranking de clientes más frecuentes" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
