import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { FloatingTooltip } from './FloatingTooltip'

interface HoverTooltipSectionProps {
  children: ReactNode
  tooltip: ReactNode
  className?: string
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(hover: none)').matches
}

export function HoverTooltipSection({ children, tooltip, className = '' }: HoverTooltipSectionProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const [hoverOpen, setHoverOpen] = useState(false)
  const [tapOpen, setTapOpen] = useState(false)
  const open = hoverOpen || tapOpen

  useEffect(() => {
    if (!tapOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) {
        setTapOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [tapOpen])

  const showHover = () => setHoverOpen(true)
  const hideHover = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setHoverOpen(false)
    }
  }

  const handleClick = () => {
    if (isCoarsePointer()) {
      setTapOpen((current) => !current)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setTapOpen((current) => !current)
    }
    if (event.key === 'Escape') {
      setTapOpen(false)
      setHoverOpen(false)
    }
  }

  return (
    <div
      ref={anchorRef}
      className={className}
      tabIndex={0}
      onMouseEnter={showHover}
      onMouseLeave={() => setHoverOpen(false)}
      onFocusCapture={showHover}
      onBlurCapture={hideHover}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      <FloatingTooltip
        anchorRef={anchorRef}
        open={open}
        id={tooltipId}
        textAlign="left"
        maxWidthClass="max-w-72"
      >
        {tooltip}
      </FloatingTooltip>
    </div>
  )
}
