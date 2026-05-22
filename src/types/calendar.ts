export type CalendarView = "day" | "week" | "month" | "chairs"

export interface Chair {
  id: string
  name: string
  avatarUrl: string | null
}

export interface BookingEvent {
  id: string
  startTime: string
  endTime: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  notes: string | null
  paidAmount: string | null
  service: {
    id: string
    name: string
    color: string
    durationMinutes: number
    price: string
  }
  chair: {
    id: string
    name: string
    color: string
    user: { id: string; name: string } | null
  }
  customer: {
    id: string
    name: string
    phone: string | null
  }
}

export interface PositionedEvent extends BookingEvent {
  top: number
  height: number
  column: number
  totalColumns: number
}
