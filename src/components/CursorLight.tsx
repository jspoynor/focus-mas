import { useEffect } from 'react'
import {
  createInitialSuppressionState,
  isCursorLightSuppressed,
  reduceCursorLightSuppression,
  type CursorLightSuppressionState,
} from '../lib/cursorLightSuppression'

const GLASS_SELECTOR =
  '.glass-panel, .glass-surface, .glass-card, .glass-card-elevated, .glass-nav, .glass-btn, .glass-btn-secondary, .glass-btn-pill, .glass-btn-oval, .ui-surface'

const SUPPRESSED_CLASS = 'cursor-light-suppressed'

/**
 * Tracks pointer position as per-element CSS variables for the cursor spotlight on glass UI.
 * Coordinates are relative to each glass surface so glows stay aligned inside transformed
 * or scrolled containers (e.g. the post-session survey slide-in).
 *
 * Suppresses updates and hides the glow when the page is unfocused, scrolling, or running
 * below the FPS threshold so the effect does not look choppy.
 */
export function CursorLight() {
  useEffect(() => {
    const root = document.documentElement
    let x = root.clientWidth / 2
    let y = root.clientHeight / 2
    let suppressionState: CursorLightSuppressionState = createInitialSuppressionState({
      pageVisible: !document.hidden,
      pageFocused: document.hasFocus(),
    })
    let suppressed = isCursorLightSuppressed(suppressionState, performance.now())
    let loopId = 0
    let lastFrameTime = performance.now()

    function updateGlassSurfaces() {
      for (const el of document.querySelectorAll<HTMLElement>(GLASS_SELECTOR)) {
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--cursor-x', `${x - rect.left}px`)
        el.style.setProperty('--cursor-y', `${y - rect.top}px`)
      }
    }

    function applySuppressedClass(nextSuppressed: boolean) {
      root.classList.toggle(SUPPRESSED_CLASS, nextSuppressed)
    }

    function syncSuppression(now: number) {
      const nextSuppressed = isCursorLightSuppressed(suppressionState, now)
      if (nextSuppressed !== suppressed) {
        suppressed = nextSuppressed
        applySuppressedClass(suppressed)
        if (!suppressed) {
          updateGlassSurfaces()
        }
      }
    }

    function onPointerMove(event: PointerEvent) {
      x = event.clientX
      y = event.clientY
      suppressionState = reduceCursorLightSuppression(suppressionState, {
        type: 'pointerMove',
      })
      const now = performance.now()
      syncSuppression(now)
      if (!suppressed) {
        updateGlassSurfaces()
      }
    }

    function onScroll() {
      const now = performance.now()
      suppressionState = reduceCursorLightSuppression(suppressionState, {
        type: 'scroll',
        now,
      })
      syncSuppression(now)
    }

    function onVisibilityChange() {
      const now = performance.now()
      suppressionState = reduceCursorLightSuppression(suppressionState, {
        type: 'visibility',
        visible: !document.hidden,
      })
      syncSuppression(now)
    }

    function onFocusChange() {
      const now = performance.now()
      suppressionState = reduceCursorLightSuppression(suppressionState, {
        type: 'focus',
        focused: document.hasFocus(),
      })
      syncSuppression(now)
    }

    function onResize() {
      if (!suppressed) {
        updateGlassSurfaces()
      }
    }

    function onMutation() {
      if (!suppressed) {
        updateGlassSurfaces()
      }
    }

    function loop(now: number) {
      const deltaMs = now - lastFrameTime
      lastFrameTime = now

      if (suppressionState.pageVisible && suppressionState.pageFocused) {
        suppressionState = reduceCursorLightSuppression(suppressionState, {
          type: 'frame',
          deltaMs,
        })
        syncSuppression(now)
      }

      loopId = window.requestAnimationFrame(loop)
    }

    applySuppressedClass(suppressed)
    if (!suppressed) {
      updateGlassSurfaces()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocusChange)
    window.addEventListener('blur', onFocusChange)

    const observer = new MutationObserver(onMutation)
    observer.observe(document.body, { childList: true, subtree: true })

    loopId = window.requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocusChange)
      window.removeEventListener('blur', onFocusChange)
      observer.disconnect()
      window.cancelAnimationFrame(loopId)
      root.classList.remove(SUPPRESSED_CLASS)
    }
  }, [])

  return null
}
