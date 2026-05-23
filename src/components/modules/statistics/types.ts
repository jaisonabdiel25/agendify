export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

export interface KpiData {
  totalBookings: number
  revenue: string
  avgTicket: string
  cancellationRate: number
}

export interface StatusSlice {
  status: BookingStatus
  count: number
}

export interface DailyPoint {
  day: number
  label: string
  count: number
}

export interface MonthlyPoint {
  month: string
  label: string
  count: number
}

export interface ServicePoint {
  serviceId: string
  name: string
  color: string
  count: number
}

export interface ChairPoint {
  chairId: string
  name: string
  count: number
}

export interface CustomerRow {
  customerId: string
  name: string
  totalBookings: number
  totalSpent: string
}
