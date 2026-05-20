"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DaySchedule {
  dayOfWeek: number
  isActive: boolean
  openTime: string
  closeTime: string
}

interface ChairData {
  id: string
  name: string
  schedules: DaySchedule[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function buildInitialState(schedules: DaySchedule[]): DaySchedule[] {
  return DAY_ORDER.map((day) => {
    const existing = schedules.find((s) => s.dayOfWeek === day)
    return {
      dayOfWeek: day,
      isActive: existing?.isActive ?? false,
      openTime: existing?.openTime ?? "09:00",
      closeTime: existing?.closeTime ?? "18:00",
    }
  })
}

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-checked={active}
      role="switch"
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "bg-foreground" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow-sm transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function ScheduleForm({ chair }: { chair: ChairData }) {
  const [days, setDays] = useState<DaySchedule[]>(() => buildInitialState(chair.schedules))
  const [saving, setSaving] = useState(false)

  function toggleDay(dayOfWeek: number) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isActive: !d.isActive } : d))
    )
  }

  function updateTime(dayOfWeek: number, field: "openTime" | "closeTime", value: string) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: days }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Error al guardar el cronograma")
        return
      }

      toast.success("Cronograma guardado")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div
          key={day.dayOfWeek}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
            day.isActive ? "border-border bg-card" : "border-border/50 bg-muted/20"
          }`}
        >
          {/* Day name */}
          <span
            className={`w-24 text-sm font-medium shrink-0 ${
              day.isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {DAY_LABELS[day.dayOfWeek]}
          </span>

          {/* Toggle */}
          <Toggle active={day.isActive} onChange={() => toggleDay(day.dayOfWeek)} />

          {/* Status label */}
          <span className={`text-xs w-14 shrink-0 ${day.isActive ? "text-foreground" : "text-muted-foreground"}`}>
            {day.isActive ? "Abierto" : "Cerrado"}
          </span>

          {/* Time inputs */}
          <div className={`flex items-center gap-2 flex-1 transition-opacity ${day.isActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
            <Input
              type="time"
              value={day.openTime}
              onChange={(e) => updateTime(day.dayOfWeek, "openTime", e.target.value)}
              className="h-8 text-sm w-28"
              disabled={!day.isActive}
            />
            <span className="text-muted-foreground text-xs shrink-0">hasta</span>
            <Input
              type="time"
              value={day.closeTime}
              onChange={(e) => updateTime(day.dayOfWeek, "closeTime", e.target.value)}
              className="h-8 text-sm w-28"
              disabled={!day.isActive}
            />
          </div>
        </div>
      ))}

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </div>
  )
}
