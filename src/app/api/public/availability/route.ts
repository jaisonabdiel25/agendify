import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0")
  const m = (minutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chairId = searchParams.get("chairId")
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date") // "YYYY-MM-DD"

  if (!chairId || !serviceId || !date) {
    return NextResponse.json({ error: "chairId, serviceId y date son requeridos" }, { status: 400 })
  }

  // Parse date in local time to get correct dayOfWeek
  const [year, month, day] = date.split("-").map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayOfWeek = dateObj.getDay()

  const [schedule, service] = await Promise.all([
    prisma.chairSchedule.findUnique({
      where: { chairId_dayOfWeek: { chairId, dayOfWeek } },
    }),
    prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMinutes: true },
    }),
  ])

  if (!schedule || !schedule.isActive || !service) {
    return NextResponse.json([])
  }

  const openMin = parseTimeToMinutes(schedule.openTime)
  const closeMin = parseTimeToMinutes(schedule.closeTime)
  const duration = service.durationMinutes

  // Existing bookings that day
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59)

  const bookings = await prisma.booking.findMany({
    where: {
      chairId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { not: "CANCELLED" },
    },
    select: { startTime: true, endTime: true },
  })

  // Convert bookings to minute ranges
  const bookedRanges = bookings.map((b) => ({
    start: b.startTime.getHours() * 60 + b.startTime.getMinutes(),
    end: b.endTime.getHours() * 60 + b.endTime.getMinutes(),
  }))

  // Generate available slots every 30 min
  const slots: string[] = []
  let current = openMin
  while (current + duration <= closeMin) {
    const slotEnd = current + duration
    const overlaps = bookedRanges.some((b) => current < b.end && slotEnd > b.start)
    if (!overlaps) {
      slots.push(minutesToTime(current))
    }
    current += 30
  }

  return NextResponse.json(slots)
}
