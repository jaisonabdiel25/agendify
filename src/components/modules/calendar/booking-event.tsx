import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { PositionedEvent } from "@/types/calendar"

interface BookingEventProps {
  event: PositionedEvent
  onClick: (event: PositionedEvent) => void
}

const STATUS_STYLES: Record<PositionedEvent["status"], string> = {
  PENDING: "opacity-80 border-dashed",
  CONFIRMED: "opacity-100",
  COMPLETED: "opacity-60",
  CANCELLED: "opacity-40 line-through",
  NO_SHOW: "opacity-40",
}

export function BookingEvent({ event, onClick }: BookingEventProps) {
  const widthPct = 100 / event.totalColumns
  const leftPct = (event.column / event.totalColumns) * 100
  const startTime = new Date(event.startTime)
  const isShort = event.height < 48

  return (
    <button
      onClick={() => onClick(event)}
      className={cn(
        "absolute rounded-md px-2 py-1 text-left overflow-hidden border border-white/20",
        "hover:brightness-110 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/50",
        STATUS_STYLES[event.status]
      )}
      style={{
        top: event.top,
        height: event.height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: event.service.color,
      }}
    >
      <p className="text-white text-xs font-semibold leading-tight truncate">
        {event.customer.name}
      </p>
      {!isShort && (
        <p className="text-white/80 text-[0.65rem] leading-tight truncate mt-0.5">
          {event.service.name} · {format(startTime, "HH:mm")}
        </p>
      )}
      {!isShort && event.chair && (
        <p className="text-white/60 text-[0.6rem] leading-tight truncate">
          {event.chair.name}
        </p>
      )}
    </button>
  )
}
