import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  BookingsTable,
  type BookingRow,
} from "@/components/modules/booking/bookings-table";

const PAGE_SIZE = 10;

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.businessId) redirect("/login");

  const { id: userId, businessId, role } = session.user;
  const { page: pageParam, filter: filterParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const currentFilter: "all" | "mine" = filterParam === "mine" ? "mine" : "all";
  const skip = (page - 1) * PAGE_SIZE;

  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";

  let myChairIds: string[] = [];

  if (isOwnerOrAdmin) {
    const myChairs = await prisma.chair.findMany({
      where: { userId, businessId },
      select: { id: true },
    });
    myChairIds = myChairs.map((c) => c.id);
  }

  const where: Prisma.BookingWhereInput = { businessId };

  if (isOwnerOrAdmin && currentFilter === "mine") {
    where.chairId = { in: myChairIds };
  } else if (!isOwnerOrAdmin) {
    const chair = await prisma.chair.findFirst({
      where: { userId, businessId },
      select: { id: true },
    });
    where.chairId = chair?.id ?? "__no_chair__";
  }

  const [rawBookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: {
          select: { id: true, name: true, color: true, durationMinutes: true, price: true },
        },
        chair: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { startTime: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ]);

  if (page > 1 && rawBookings.length === 0 && totalCount > 0) {
    const lastPage = Math.ceil(totalCount / PAGE_SIZE);
    const qs = new URLSearchParams();
    qs.set("page", String(lastPage));
    if (currentFilter === "mine") qs.set("filter", "mine");
    redirect(`/booking?${qs.toString()}`);
  }

  const bookings: BookingRow[] = rawBookings.map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    status: b.status,
    notes: b.notes,
    service: { ...b.service, price: b.service.price.toString() },
    chair: b.chair,
    customer: b.customer,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-light text-3xl">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "STAFF"
              ? "Reservas de tu puesto asignado."
              : "Gestiona todas las reservas de tu negocio."}
          </p>
        </div>
        <Button asChild>
          <Link href="/booking/new">
            <Plus className="h-4 w-4" />
            Nueva reserva
          </Link>
        </Button>
      </div>

      <BookingsTable
        bookings={bookings}
        myChairIds={myChairIds}
        role={role as "OWNER" | "ADMIN" | "STAFF"}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        currentFilter={currentFilter}
      />
    </div>
  );
}
