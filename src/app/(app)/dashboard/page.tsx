import { startOfWeek, endOfWeek } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/modules/calendar/calendar-view";
import type { BookingEvent, Chair } from "@/types/calendar";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const isStaff = session!.user.role === "STAFF";

  const bookings = await prisma.booking.findMany({
    where: {
      businessId: session!.user.businessId,
      startTime: { gte: weekStart, lte: weekEnd },
      status: { not: "CANCELLED" },
      ...(isStaff ? { chair: { userId: session!.user.id } } : {}),
    },
    include: {
      service: {
        select: { id: true, name: true, color: true, durationMinutes: true },
      },
      chair: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const chairsRaw = await prisma.chair.findMany({
    where: { businessId: session!.user.businessId, isActive: true },
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  const initialBookings: BookingEvent[] = bookings.map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    notes: b.notes,
    service: b.service,
    chair: b.chair,
    customer: b.customer,
  }));

  const initialChairs: Chair[] = chairsRaw;

  return (
    <div className="h-full flex flex-col p-4">
      <CalendarView
        initialBookings={initialBookings}
        initialDate={now.toISOString()}
        initialView="week"
        initialChairs={initialChairs}
        initialShowOnlyMine={isStaff}
        canToggle={!isStaff}
      />
    </div>
  );
}
