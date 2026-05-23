"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BusinessesPaginationProps {
  total: number
  pageSize: number
  currentPage: number
  pageParam?: string
}

export function BusinessesPagination({ total, pageSize, currentPage, pageParam = "page" }: BusinessesPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(pageParam, String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">
        Página {currentPage} de {totalPages} · {total} negocios
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
