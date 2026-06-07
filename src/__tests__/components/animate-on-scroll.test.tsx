/**
 * @jest-environment jsdom
 */

import { render, screen, act } from "@testing-library/react"
import { AnimateOnScroll } from "@/components/animate-on-scroll"

const mockObserve = jest.fn()
const mockUnobserve = jest.fn()
const mockDisconnect = jest.fn()

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void
let capturedCallback: IntersectionCallback

beforeEach(() => {
  mockObserve.mockClear()
  mockUnobserve.mockClear()
  mockDisconnect.mockClear()

  global.IntersectionObserver = jest.fn().mockImplementation((cb: IntersectionCallback) => {
    capturedCallback = cb
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }
  }) as unknown as typeof IntersectionObserver
})

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    capturedCallback([{ isIntersecting } as IntersectionObserverEntry])
  })
}

describe("AnimateOnScroll — estado inicial SSR", () => {
  it("renderiza los children sin error", () => {
    render(<AnimateOnScroll><span>Contenido</span></AnimateOnScroll>)
    expect(screen.getByText("Contenido")).toBeInTheDocument()
  })

  it("el elemento raíz tiene opacity 0 antes de ser visible", () => {
    render(<AnimateOnScroll data-testid="box"><span>Hola</span></AnimateOnScroll>)
    const box = screen.getByText("Hola").parentElement!
    expect(box.style.opacity).toBe("0")
  })

  it("no tiene clase de animación antes de entrar al viewport", () => {
    render(<AnimateOnScroll><span>Texto</span></AnimateOnScroll>)
    const el = screen.getByText("Texto").parentElement!
    expect(el.className).not.toContain("animate-slide-up")
  })
})

describe("AnimateOnScroll — IntersectionObserver", () => {
  it("llama a observe al montar", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  it("añade la clase animate-slide-up al entrar al viewport", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    const el = screen.getByText("Test").parentElement!
    expect(el.className).not.toContain("animate-slide-up")
    triggerIntersection(true)
    expect(el.className).toContain("animate-slide-up")
  })

  it("llama a unobserve tras la primera intersección", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    triggerIntersection(true)
    expect(mockUnobserve).toHaveBeenCalledTimes(1)
  })

  it("no activa la animación si isIntersecting es false", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    triggerIntersection(false)
    const el = screen.getByText("Test").parentElement!
    expect(el.className).not.toContain("animate-slide-up")
  })

  it("llama a disconnect al desmontar", () => {
    const { unmount } = render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    unmount()
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})

describe("AnimateOnScroll — prop animation", () => {
  it("usa animate-slide-up por defecto", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    triggerIntersection(true)
    expect(screen.getByText("Test").parentElement!.className).toContain("animate-slide-up")
  })

  it("usa animate-fade-in cuando animation='fade-in'", () => {
    render(<AnimateOnScroll animation="fade-in"><span>Test</span></AnimateOnScroll>)
    triggerIntersection(true)
    expect(screen.getByText("Test").parentElement!.className).toContain("animate-fade-in")
  })

  it("usa animate-fade-in-up cuando animation='fade-in-up'", () => {
    render(<AnimateOnScroll animation="fade-in-up"><span>Test</span></AnimateOnScroll>)
    triggerIntersection(true)
    expect(screen.getByText("Test").parentElement!.className).toContain("animate-fade-in-up")
  })

  it("usa animate-counter-up cuando animation='counter-up'", () => {
    render(<AnimateOnScroll animation="counter-up"><span>Test</span></AnimateOnScroll>)
    triggerIntersection(true)
    expect(screen.getByText("Test").parentElement!.className).toContain("animate-counter-up")
  })
})

describe("AnimateOnScroll — prop delay", () => {
  it("aplica animationDelay en el style cuando se pasa delay", () => {
    render(<AnimateOnScroll delay={200}><span>Test</span></AnimateOnScroll>)
    const el = screen.getByText("Test").parentElement!
    expect(el.style.animationDelay).toBe("200ms")
  })

  it("no aplica animationDelay si no se pasa delay", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    const el = screen.getByText("Test").parentElement!
    expect(el.style.animationDelay).toBe("")
  })
})

describe("AnimateOnScroll — prop as", () => {
  it("renderiza un <div> por defecto", () => {
    render(<AnimateOnScroll><span>Test</span></AnimateOnScroll>)
    const el = screen.getByText("Test").parentElement!
    expect(el.tagName).toBe("DIV")
  })

  it("renderiza un <section> cuando as='section'", () => {
    render(<AnimateOnScroll as="section"><span>Test</span></AnimateOnScroll>)
    const el = screen.getByText("Test").parentElement!
    expect(el.tagName).toBe("SECTION")
  })
})

describe("AnimateOnScroll — staggerChildren", () => {
  it("asigna --stagger-index y --stagger-delay a cada hijo al entrar al viewport", () => {
    render(
      <AnimateOnScroll staggerChildren staggerDelay={100}>
        <span>Hijo 1</span>
        <span>Hijo 2</span>
        <span>Hijo 3</span>
      </AnimateOnScroll>
    )
    triggerIntersection(true)
    const parent = screen.getByText("Hijo 1").parentElement!
    const children = Array.from(parent.children) as HTMLElement[]

    expect(children[0].style.getPropertyValue("--stagger-index")).toBe("0")
    expect(children[1].style.getPropertyValue("--stagger-index")).toBe("1")
    expect(children[2].style.getPropertyValue("--stagger-index")).toBe("2")
    expect(children[0].style.getPropertyValue("--stagger-delay")).toBe("100ms")
  })

  it("añade la clase animate-fade-in-up a cada hijo cuando staggerChildren", () => {
    render(
      <AnimateOnScroll staggerChildren>
        <span>A</span>
        <span>B</span>
      </AnimateOnScroll>
    )
    triggerIntersection(true)
    const parent = screen.getByText("A").parentElement!
    const children = Array.from(parent.children) as HTMLElement[]
    children.forEach((child) => {
      expect(child.classList.contains("animate-fade-in-up")).toBe(true)
    })
  })

  it("no añade clase de animación al elemento raíz cuando staggerChildren está activo", () => {
    render(
      <AnimateOnScroll staggerChildren>
        <span>A</span>
      </AnimateOnScroll>
    )
    triggerIntersection(true)
    const parent = screen.getByText("A").parentElement!
    expect(parent.className).not.toContain("animate-slide-up")
  })
})
