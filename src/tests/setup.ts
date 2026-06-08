import "@testing-library/jest-dom"

// input-otp uses ResizeObserver and document.elementFromPoint which are not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null
}
