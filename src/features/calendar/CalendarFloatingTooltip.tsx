import { useLayoutEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface CalendarFloatingTooltipProps {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  id: string
  textAlign?: 'center' | 'left'
  children: ReactNode
}

export function CalendarFloatingTooltip({
  anchorRef,
  open,
  id,
  textAlign = 'center',
  children,
}: CalendarFloatingTooltipProps) {
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null)
      return
    }

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      setStyle({
        position: 'fixed',
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
        transform: 'translate(-50%, -100%)',
      })
    }

    updatePosition()

    const scrollContainer = anchorRef.current?.closest('.calendar-scroll')
    scrollContainer?.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      scrollContainer?.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef])

  if (!open || !style) return null

  return createPortal(
    <div
      id={id}
      role="tooltip"
      style={style}
      className={`pointer-events-none z-50 w-max max-w-52 rounded-glass glass-tooltip px-3 py-2 text-xs text-white shadow-lg ${
        textAlign === 'left' ? 'text-left' : 'text-center'
      }`}
    >
      {children}
    </div>,
    document.body,
  )
}
