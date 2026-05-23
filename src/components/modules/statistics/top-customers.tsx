"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { CustomerRow } from "./types"

const fmt = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" })
const PAGE_SIZE = 5

interface TopCustomersProps {
  data: CustomerRow[]
}

export function TopCustomers({ data }: TopCustomersProps) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const pageData = data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mejores clientes</CardTitle>
        <CardDescription>
          {data.length > 0 ? `${data.length} clientes por reservas en el período` : "Top clientes por reservas en el período"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sin reservas en este período
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                      #
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">
                      Cliente
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">
                      Reservas
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs whitespace-nowrap">
                      Total gastado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageData.map((row, i) => (
                    <tr key={row.customerId} className="hover:bg-muted/20 transition-colors duration-100">
                      <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">
                        {page * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-sm">{row.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm">
                        {row.totalBookings}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm text-muted-foreground whitespace-nowrap">
                        {fmt.format(parseFloat(row.totalSpent))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, data.length)} de {data.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-muted-foreground min-w-12 text-center">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages - 1}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
