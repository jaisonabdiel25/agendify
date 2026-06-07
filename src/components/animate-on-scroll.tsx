"use client"

import { useEffect, useRef, useState } from "react"

interface AnimateOnScrollProps {
  children: React.ReactNode
  animation?: "slide-up" | "fade-in" | "fade-in-up" | "counter-up"
  delay?: number
  staggerChildren?: boolean
  staggerDelay?: number
  threshold?: number
  className?: string
  as?: React.ElementType
}

export function AnimateOnScroll({
  children,
  animation = "slide-up",
  delay,
  staggerChildren = false,
  staggerDelay = 60,
  threshold = 0.15,
  className = "",
  as: Tag = "div",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !ref.current) return

    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mounted, threshold])

  useEffect(() => {
    if (!isVisible || !staggerChildren || !ref.current) return
    const items = Array.from(ref.current.children) as HTMLElement[]
    items.forEach((child, i) => {
      child.style.setProperty("--stagger-index", String(i))
      child.style.setProperty("--stagger-delay", `${staggerDelay}ms`)
      child.classList.add("animate-fade-in-up", "animation-stagger")
    })
  }, [isVisible, staggerChildren, staggerDelay])

  const style: React.CSSProperties = {
    ...(!mounted || !isVisible ? { opacity: 0 } : {}),
    ...(delay !== undefined ? { animationDelay: `${delay}ms` } : {}),
  }

  return (
    <Tag
      ref={ref}
      className={`${isVisible && !staggerChildren ? `animate-${animation}` : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  )
}
