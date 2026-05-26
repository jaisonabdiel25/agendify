import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { BookingWizard } from "@/components/modules/reserve/booking-wizard"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ReserveBusinessPage({ params }: Props) {
  const { slug } = await params

  const business = await prisma.business.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, address: true },
  })

  if (!business) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity"
          >
            Agendify
          </Link>
          <Link
            href="/reserve"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Buscar otro negocio
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <BookingWizard initialBusiness={business} />
      </div>
    </div>
  )
}
