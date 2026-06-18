import { useEffect } from 'react'

const GLASS_SELECTOR =
  '.glass-panel, .glass-surface, .glass-card, .glass-card-elevated, .glass-nav, .glass-btn, .glass-btn-secondary, .glass-btn-pill, .glass-btn-oval, .ui-surface'

/**
 * Tracks pointer position as per-element CSS variables for the cursor spotlight on glass UI.
 * Coordinates are relative to each glass surface so glows stay aligned inside transformed
 * or scrolled containers (e.g. the post-session survey slide-in).
 */
export function CursorLight() {
  useEffect(() => {
    const root = document.documentElement
    let rafId = 0
    let x = root.clientWidth / 2
    let y = root.clientHeight / 2

    function updateGlassSurfaces() {
      for (const el of document.querySelectorAll<HTMLElement>(GLASS_SELECTOR)) {
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--cursor-x', `${x - rect.left}px`)
        el.style.setProperty('--cursor-y', `${y - rect.top}px`)
      }
    }

    function flush() {
      updateGlassSurfaces()
      rafId = 0
    }

    function scheduleFlush() {
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush)
      }
    }

    function onPointerMove(event: PointerEvent) {
      x = event.clientX
      y = event.clientY
      scheduleFlush()
    }

    flush()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', scheduleFlush, { passive: true, capture: true })
    window.addEventListener('resize', scheduleFlush, { passive: true })

    const observer = new MutationObserver(scheduleFlush)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', scheduleFlush, { capture: true })
      window.removeEventListener('resize', scheduleFlush)
      observer.disconnect()
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return null
}
