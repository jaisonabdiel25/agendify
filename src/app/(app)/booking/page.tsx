import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BookingsTable,
  type BookingRow,
} from "@/components/modules/booking/bookings-table";

export default async function BookingPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.businessId) redirect("/login");

  const { id: userId, businessId, role } = session.user;

  let bookings: BookingRow[];
  let myChairIds: string[] = [];

  if (role === "OWNER" || role === "ADMIN") {
    const [rawBookings, myChairs] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              color: true,
              durationMinutes: true,
            },
          },
          chair: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { startTime: "desc" },
      }),
      prisma.chair.findMany({
        where: { userId, businessId },
        select: { id: true },
      }),
    ]);

    bookings = rawBookings.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      status: b.status,
      notes: b.notes,
      service: b.service,
      chair: b.chair,
      customer: b.customer,
    }));
    myChairIds = myChairs.map((c) => c.id);
  } else {
    const chair = await prisma.chair.findFirst({
      where: { userId, businessId },
      select: { id: true },
    });

    const rawBookings = chair
      ? await prisma.booking.findMany({
          where: { businessId, chairId: chair.id },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                color: true,
                durationMinutes: true,
              },
            },
            chair: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { startTime: "desc" },
        })
      : [];

    bookings = rawBookings.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      status: b.status,
      notes: b.notes,
      service: b.service,
      chair: b.chair,
      customer: b.customer,
    }));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-light text-3xl">Reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "STAFF"
            ? "Reservas de tu puesto asignado."
            : "Gestiona todas las reservas de tu negocio."}
        </p>
      </div>

      <BookingsTable
        bookings={bookings}
        myChairIds={myChairIds}
        role={role as "OWNER" | "ADMIN" | "STAFF"}
      />
    </div>
  );
}
