"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingRow {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  service: { id: string; name: string; color: string; durationMinutes: number };
  chair: { id: string; name: string };
  customer: { id: string; name: string; phone: string | null };
}

interface BookingsTableProps {
  bookings: BookingRow[];
  myChairIds: string[];
  role: "OWNER" | "ADMIN" | "STAFF";
  totalCount: number;
  page: number;
  pageSize: number;
  currentFilter: "all" | "mine";
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingRow["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const STATUS_BADGE: Record<BookingRow["status"], string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  COMPLETED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CANCELLED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-red-500/10 text-red-600 dark:text-red-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(page: number, filter: "all" | "mine"): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filter === "mine") params.set("filter", "mine");
  const qs = params.toString();
  return `/booking${qs ? `?${qs}` : ""}`;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  if (total > 1) pages.push(total);

  return pages;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingsTable({
  bookings,
  myChairIds,
  role,
  totalCount,
  page,
  pageSize,
  currentFilter,
}: BookingsTableProps) {
  const router = useRouter();
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const totalPages = Math.ceil(totalCount / pageSize);

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function navigate(newPage: number, filter: "all" | "mine") {
    router.push(buildUrl(newPage, filter));
  }

  const noChairAssigned =
    isOwnerOrAdmin && currentFilter === "mine" && myChairIds.length === 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {isOwnerOrAdmin && (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => navigate(1, "all")}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
              currentFilter === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas las reservas
          </button>
          <button
            onClick={() => navigate(1, "mine")}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
              currentFilter === "mine"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Mis reservas
          </button>
        </div>
      )}

      {noChairAssigned ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No tienes puestos asignados.
        </p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay reservas para mostrar.
        </p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-125">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
                    Fecha
                  </th>
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">
                    Cliente
                  </th>
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">
                    Servicio
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-muted-foreground text-sm">
                    Puesto
                  </th>
                  <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">
                    Estado
                  </th>
                  <th className="hidden md:table-cell text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap text-sm">
                    Duración
                  </th>
                  <th className="hidden lg:table-cell text-left px-4 py-3 font-medium text-muted-foreground text-sm">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-muted/20 transition-colors duration-100"
                  >
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(booking.startTime), "dd/MM/yy HH:mm", {
                        locale: es,
                      })}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <p className="font-medium text-xs sm:text-sm">
                        {booking.customer.name}
                      </p>
                      {booking.customer.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                          {booking.customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: booking.service.color }}
                        />
                        <span className="text-xs sm:text-sm truncate max-w-25 sm:max-w-none">
                          {booking.service.name}
                        </span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                      {booking.chair.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] sm:text-xs font-medium whitespace-nowrap ${STATUS_BADGE[booking.status]}`}
                      >
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {booking.service.durationMinutes} min
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-muted-foreground max-w-50">
                      {booking.notes ? (
                        <span className="line-clamp-1 text-xs">
                          {booking.notes}
                        </span>
                      ) : (
                        <span className="text-xs opacity-40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? "Sin resultados"
                : `${rangeStart}–${rangeEnd} de ${totalCount} reservas`}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(page - 1, currentFilter)}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-xs text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => navigate(p, currentFilter)}
                      className={`inline-flex items-center justify-center h-7 min-w-7 px-1.5 rounded-md text-xs font-medium transition-colors ${
                        p === page
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  onClick={() => navigate(page + 1, currentFilter)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
