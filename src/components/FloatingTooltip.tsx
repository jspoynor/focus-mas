import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { computeTooltipPosition } from '../lib/tooltipPosition'

interface FloatingTooltipProps {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  id: string
  textAlign?: 'center' | 'left'
  maxWidthClass?: string
  children: ReactNode
}

const HIDDEN_STYLE: CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  visibility: 'hidden',
}

export function FloatingTooltip({
  anchorRef,
  open,
  id,
  textAlign = 'center',
  maxWidthClass = 'max-w-52',
  children,
}: FloatingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null)
      return
    }

    const updatePosition = () => {
      const anchor = anchorRef.current
      const tooltip = tooltipRef.current
      if (!anchor || !tooltip) return

      const anchorRect = anchor.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const { left, top } = computeTooltipPosition({
        anchorRect,
        tooltipSize: { width: tooltipRect.width, height: tooltipRect.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      })

      setStyle({
        position: 'fixed',
        left,
        top,
        visibility: 'visible',
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
  }, [open, anchorRef, children])

  if (!open) return null

  return createPortal(
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      style={style ?? HIDDEN_STYLE}
      className={`pointer-events-none z-50 w-max ${maxWidthClass} rounded-glass glass-tooltip px-3 py-2 text-xs text-white shadow-lg ${
        textAlign === 'left' ? 'text-left' : 'text-center'
      }`}
    >
      {children}
    </div>,
    document.body,
  )
}
