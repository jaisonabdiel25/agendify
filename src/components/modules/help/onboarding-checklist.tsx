import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"

export interface OnboardingStep {
  title: string
  description: string
  href?: string
  done: boolean
  optional?: boolean
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[]
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  return (
    <ul className="space-y-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={`flex items-start gap-3 rounded-xl border border-border p-4 transition-colors ${
            step.done ? "bg-muted/30" : "bg-card"
          }`}
        >
          {step.done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
              <h2 className={`text-sm font-medium ${step.done ? "text-muted-foreground" : "text-foreground"}`}>
                {step.title}
              </h2>
              {step.optional && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Opcional
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>

          {step.href && (
            <Link
              href={step.href}
              className="flex shrink-0 items-center gap-1 self-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ir
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
