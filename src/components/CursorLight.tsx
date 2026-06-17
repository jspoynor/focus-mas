import { useEffect } from 'react'

/**
 * Tracks pointer position as CSS variables for the cursor spotlight on glass UI.
 */
export function CursorLight() {
  useEffect(() => {
    const root = document.documentElement
    let rafId = 0
    let x = root.clientWidth / 2
    let y = root.clientHeight / 2

    function flush() {
      root.style.setProperty('--cursor-x', `${x}px`)
      root.style.setProperty('--cursor-y', `${y}px`)
      rafId = 0
    }

    function onPointerMove(event: PointerEvent) {
      x = event.clientX
      y = event.clientY
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush)
      }
    }

    flush()
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return null
}
