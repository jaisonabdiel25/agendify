import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NewBookingForm } from "@/components/modules/booking/new-booking-form"

export default async function NewBookingPage() {
  const session = await auth()
  if (!session?.user?.id || !session.user.businessId) redirect("/login")

  const { id: userId, businessId, role } = session.user
  const isStaff = role === "STAFF"

  const chairs = await prisma.chair.findMany({
    where: {
      businessId,
      isActive: true,
      ...(isStaff ? { userId } : {}),
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  })

  return <NewBookingForm chairs={chairs} />
}
