"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { PLAN_PRICE_MIN, PLAN_DISCOUNT_MIN, PLAN_DISCOUNT_MAX } from "@/constant"

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanData {
  id: string
  type: string
  name: string
  maxServices: number
  maxChairs: number
  maxUsers: number
  canInvite: boolean
  statisticsCharts: string[]
  price: string | null
  discount: number | null
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const nullableNumber = z.preprocess(
  (v) => (v === "" || (typeof v === "number" && isNaN(v)) ? null : v === null || v === undefined ? null : Number(v)),
  z.number().nullable()
)

const schema = z.object({
  type: z.string().min(2, "El tipo debe tener al menos 2 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  maxServices: z.number({ error: "Ingresa un número" }).int().min(1, "Mínimo 1"),
  maxChairs: z.number({ error: "Ingresa un número" }).int().min(1, "Mínimo 1"),
  maxUsers: z.number({ error: "Ingresa un número" }).int().min(1, "Mínimo 1"),
  canInvite: z.boolean(),
  price: nullableNumber.pipe(z.number().min(PLAN_PRICE_MIN, "El precio no puede ser negativo").nullable()),
  discount: nullableNumber.pipe(
    z
      .number()
      .min(PLAN_DISCOUNT_MIN, "El descuento no puede ser negativo")
      .max(PLAN_DISCOUNT_MAX, "El descuento no puede superar el 100%")
      .nullable()
  ),
})

type FormValues = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlanFormDialogProps {
  plan?: PlanData
  trigger?: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanFormDialog({ plan, trigger }: PlanFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const isEditMode = !!plan

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: isEditMode
      ? {
          type: plan.type,
          name: plan.name,
          maxServices: plan.maxServices,
          maxChairs: plan.maxChairs,
          maxUsers: plan.maxUsers,
          canInvite: plan.canInvite,
          price: plan.price !== null ? Number(plan.price) : null,
          discount: plan.discount,
        }
      : {
          type: "",
          name: "",
          maxServices: 1,
          maxChairs: 1,
          maxUsers: 1,
          canInvite: false,
          price: null,
          discount: null,
        },
  })

  async function onSubmit(data: FormValues) {
    setServerError(null)

    const statisticsCharts = isEditMode ? plan.statisticsCharts : ["status"]
    const url = isEditMode ? `/api/admin/plans/${plan.id}` : "/api/admin/plans"
    const method = isEditMode ? "PATCH" : "POST"

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, statisticsCharts }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setServerError(body.error ?? "Error al guardar el plan.")
      return
    }

    toast.success(isEditMode ? `Plan "${data.name}" actualizado.` : `Plan "${data.name}" creado.`)
    router.refresh()
    setOpen(false)
    if (!isEditMode) reset()
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) setServerError(null)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {isEditMode ? "Editar" : "Crear plan"}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? `Editar plan: ${plan.name}` : "Crear plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* type */}
          <div className="space-y-1.5">
            <Label htmlFor="planType">Tipo</Label>
            <Input
              id="planType"
              placeholder="PRO, ENTERPRISE..."
              autoComplete="off"
              readOnly={isEditMode}
              className={isEditMode ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
              aria-invalid={!!errors.type}
              {...register("type")}
            />
            {isEditMode && (
              <p className="text-xs text-muted-foreground">El tipo identifica al plan en el sistema y no es editable.</p>
            )}
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          {/* name */}
          <div className="space-y-1.5">
            <Label htmlFor="planName">Nombre</Label>
            <Input
              id="planName"
              placeholder="Pro, Estándar..."
              autoComplete="off"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* limits */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxServices">Servicios</Label>
              <Input
                id="maxServices"
                type="number"
                min={1}
                aria-invalid={!!errors.maxServices}
                {...register("maxServices", { valueAsNumber: true })}
              />
              {errors.maxServices && <p className="text-xs text-destructive">{errors.maxServices.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxChairs">Puestos</Label>
              <Input
                id="maxChairs"
                type="number"
                min={1}
                aria-invalid={!!errors.maxChairs}
                {...register("maxChairs", { valueAsNumber: true })}
              />
              {errors.maxChairs && <p className="text-xs text-destructive">{errors.maxChairs.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxUsers">Usuarios</Label>
              <Input
                id="maxUsers"
                type="number"
                min={1}
                aria-invalid={!!errors.maxUsers}
                {...register("maxUsers", { valueAsNumber: true })}
              />
              {errors.maxUsers && <p className="text-xs text-destructive">{errors.maxUsers.message}</p>}
            </div>
          </div>

          {/* price & discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="planPrice">Precio (USD)</Label>
              <Input
                id="planPrice"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.price}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planDiscount">Descuento (%)</Label>
              <Input
                id="planDiscount"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="0"
                aria-invalid={!!errors.discount}
                {...register("discount", { valueAsNumber: true })}
              />
              {errors.discount && <p className="text-xs text-destructive">{errors.discount.message}</p>}
            </div>
          </div>

          {/* canInvite */}
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="canInvite"
              render={({ field }) => (
                <Toggle active={field.value} onChange={() => field.onChange(!field.value)} />
              )}
            />
            <Label className="cursor-pointer">Permite invitar usuarios</Label>
          </div>

          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
