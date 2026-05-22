import { format } from "date-fns"
import { cn, getContrastTextColor } from "@/lib/utils"
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

const STATUS_DOT: Record<PositionedEvent["status"], string> = {
  PENDING:   "bg-orange-400",
  CONFIRMED: "bg-sky-400",
  COMPLETED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
  NO_SHOW:   "bg-rose-700",
}

export function BookingEvent({ event, onClick }: BookingEventProps) {
  const widthPct = 100 / event.totalColumns
  const leftPct = (event.column / event.totalColumns) * 100
  const startTime = new Date(event.startTime)
  const isShort = event.height < 48
  const textColor = getContrastTextColor(event.chair.color)

  return (
    <button
      onClick={() => onClick(event)}
      className={cn(
        "absolute rounded-md px-2 py-1 text-left overflow-hidden border border-black/10",
        "hover:brightness-110 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black/20",
        STATUS_STYLES[event.status]
      )}
      style={{
        top: event.top,
        height: event.height,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: event.chair.color,
        color: textColor,
      }}
    >
      <span
        className={cn(
          "absolute top-1 right-1 h-2 w-2 rounded-full ring-1 ring-black/20",
          STATUS_DOT[event.status]
        )}
      />
      <p className="text-xs font-semibold leading-tight truncate pr-3">
        {event.customer.name}
      </p>
      {!isShort && (
        <p className="text-[0.65rem] leading-tight truncate mt-0.5" style={{ opacity: 0.8 }}>
          {event.service.name} · {format(startTime, "HH:mm")}
        </p>
      )}
      {!isShort && event.chair && (
        <p className="text-[0.6rem] leading-tight truncate" style={{ opacity: 0.65 }}>
          {event.chair.name}
        </p>
      )}
    </button>
  )
}
