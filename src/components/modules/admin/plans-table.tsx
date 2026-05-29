"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface Plan {
  id: string
  name: string
}

interface BusinessWithPlan {
  id: string
  name: string
  slug: string
  isActive: boolean
  plan: Plan
}

interface PlansTableProps {
  businesses: BusinessWithPlan[]
  plans: Plan[]
}

function PlanRow({ business, plans }: { business: BusinessWithPlan; plans: Plan[] }) {
  const [selectedPlanId, setSelectedPlanId] = useState(business.plan.id)
  const [saving, setSaving] = useState(false)

  const isDirty = selectedPlanId !== business.plan.id

  async function handleSave() {
    setSaving(true)
    const response = await fetch(`/api/admin/businesses/${business.id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlanId }),
    })

    if (response.ok) {
      toast.success(`Plan de "${business.name}" actualizado`)
    } else {
      const body = await response.json().catch(() => ({}))
      toast.error(body.error ?? "Error al actualizar el plan")
      setSelectedPlanId(business.plan.id)
    }
    setSaving(false)
  }

  return (
    <tr className="hover:bg-muted/20 transition-colors duration-100">
      <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm">{business.name}</td>
      <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-muted-foreground">
        {business.slug}
      </td>
      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            business.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {business.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id} className="text-xs">
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-3 sm:px-4 py-2.5 sm:py-3">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={!isDirty || saving}
          onClick={handleSave}
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </td>
    </tr>
  )
}

export function PlansTable({ businesses, plans }: PlansTableProps) {
  if (businesses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay negocios registrados.</p>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-md">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Negocio</th>
              <th className="hidden sm:table-cell text-left px-4 py-3 font-medium text-muted-foreground text-sm">Slug</th>
              <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Estado</th>
              <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-muted-foreground text-xs sm:text-sm">Plan</th>
              <th className="px-3 sm:px-4 py-2.5 sm:py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {businesses.map((b) => (
              <PlanRow key={b.id} business={b} plans={plans} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
