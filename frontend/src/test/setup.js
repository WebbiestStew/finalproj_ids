import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'

// Animations are covered by manual/browser checks; in unit tests they'd only
// make exit transitions asynchronous and flaky.
MotionGlobalConfig.skipAnimations = true

window.scrollTo = vi.fn()

window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverStub
window.ResizeObserver = IntersectionObserverStub

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
