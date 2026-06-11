/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { OnboardingChecklist, type OnboardingStep } from "@/components/modules/help/onboarding-checklist"

const steps: OnboardingStep[] = [
  {
    title: "Crea un puesto",
    description: "Cada puesto representa un espacio de atención.",
    href: "/chair",
    done: true,
  },
  {
    title: "Crea un servicio",
    description: "Define qué ofreces.",
    href: "/service",
    done: false,
  },
  {
    title: "Invita a tu equipo",
    description: "Genera un código de invitación.",
    href: "/business",
    done: false,
    optional: true,
  },
  {
    title: "Tienes un puesto asignado",
    description: "Tu administrador debe asignarte un puesto.",
    done: false,
  },
]

describe("OnboardingChecklist", () => {
  it("renderiza todos los pasos con su título y descripción", () => {
    render(<OnboardingChecklist steps={steps} />)
    expect(screen.getByText("Crea un puesto")).toBeInTheDocument()
    expect(screen.getByText("Cada puesto representa un espacio de atención.")).toBeInTheDocument()
    expect(screen.getByText("Crea un servicio")).toBeInTheDocument()
  })

  it("numera los pasos en orden", () => {
    render(<OnboardingChecklist steps={steps} />)
    expect(screen.getByText("1.")).toBeInTheDocument()
    expect(screen.getByText("2.")).toBeInTheDocument()
    expect(screen.getByText("3.")).toBeInTheDocument()
  })

  it("muestra un enlace 'Ir' solo en los pasos con href", () => {
    render(<OnboardingChecklist steps={steps} />)
    const links = screen.getAllByRole("link", { name: /Ir/i })
    // 3 de los 4 pasos tienen href
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute("href", "/chair")
    expect(links[1]).toHaveAttribute("href", "/service")
    expect(links[2]).toHaveAttribute("href", "/business")
  })

  it("no renderiza enlace en pasos sin href", () => {
    render(<OnboardingChecklist steps={[steps[3]]} />)
    expect(screen.queryByRole("link", { name: /Ir/i })).not.toBeInTheDocument()
  })

  it("marca los pasos opcionales con la etiqueta 'Opcional'", () => {
    render(<OnboardingChecklist steps={steps} />)
    expect(screen.getByText("Opcional")).toBeInTheDocument()
  })

  it("no muestra la etiqueta 'Opcional' cuando ningún paso lo es", () => {
    render(<OnboardingChecklist steps={[steps[0], steps[1]]} />)
    expect(screen.queryByText("Opcional")).not.toBeInTheDocument()
  })

  it("renderiza una lista vacía sin pasos", () => {
    const { container } = render(<OnboardingChecklist steps={[]} />)
    expect(container.querySelectorAll("li")).toHaveLength(0)
  })
})
