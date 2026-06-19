export const TOOLTIP_GAP = 8

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface Viewport {
  width: number
  height: number
}

export type TooltipSide = 'left' | 'right' | 'above' | 'below'
export type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipPlacement {
  side: TooltipSide
  align: TooltipAlign
}

/** Left/top inclusive: boundary points fall into the lower-index third. */
export function getThirdZone(coord: number, size: number): 0 | 1 | 2 {
  if (size <= 0) return 1
  const normalized = coord / size
  return Math.min(2, Math.max(0, Math.floor(normalized * 3 - Number.EPSILON))) as 0 | 1 | 2
}

export function getTooltipPlacement(
  anchorCenterX: number,
  anchorCenterY: number,
  viewport: Viewport,
): TooltipPlacement {
  const horizontal = getThirdZone(anchorCenterX, viewport.width)
  const vertical = getThirdZone(anchorCenterY, viewport.height)

  if (horizontal === 0) {
    return {
      side: 'right',
      align: vertical === 0 ? 'start' : vertical === 1 ? 'center' : 'end',
    }
  }

  if (horizontal === 2) {
    return {
      side: 'left',
      align: vertical === 0 ? 'start' : vertical === 1 ? 'center' : 'end',
    }
  }

  if (vertical === 0) {
    return { side: 'below', align: 'start' }
  }

  if (vertical === 1) {
    return { side: 'above', align: 'center' }
  }

  return { side: 'above', align: 'end' }
}

function alignTop(anchor: Rect, tooltip: Size, align: TooltipAlign): number {
  if (align === 'start') return anchor.top
  if (align === 'end') return anchor.top + anchor.height - tooltip.height
  return anchor.top + anchor.height / 2 - tooltip.height / 2
}

function alignLeft(anchor: Rect, tooltip: Size, align: TooltipAlign): number {
  if (align === 'start') return anchor.left
  if (align === 'end') return anchor.left + anchor.width - tooltip.width
  return anchor.left + anchor.width / 2 - tooltip.width / 2
}

export function positionForPlacement(
  anchor: Rect,
  tooltip: Size,
  placement: TooltipPlacement,
  gap: number,
): { left: number; top: number } {
  const { side, align } = placement

  if (side === 'right') {
    return {
      left: anchor.left + anchor.width + gap,
      top: alignTop(anchor, tooltip, align),
    }
  }

  if (side === 'left') {
    return {
      left: anchor.left - gap - tooltip.width,
      top: alignTop(anchor, tooltip, align),
    }
  }

  if (side === 'above') {
    return {
      left: alignLeft(anchor, tooltip, align),
      top: anchor.top - gap - tooltip.height,
    }
  }

  return {
    left: alignLeft(anchor, tooltip, align),
    top: anchor.top + anchor.height + gap,
  }
}

function flipSide(side: TooltipSide): TooltipSide {
  if (side === 'left') return 'right'
  if (side === 'right') return 'left'
  if (side === 'above') return 'below'
  return 'above'
}

export function fitsInViewport(
  position: { left: number; top: number },
  tooltip: Size,
  viewport: Viewport,
  padding = 0,
): boolean {
  return (
    position.left >= padding &&
    position.top >= padding &&
    position.left + tooltip.width <= viewport.width - padding &&
    position.top + tooltip.height <= viewport.height - padding
  )
}

export function clampPosition(
  position: { left: number; top: number },
  tooltip: Size,
  viewport: Viewport,
  padding = 0,
): { left: number; top: number } {
  const maxLeft = Math.max(padding, viewport.width - tooltip.width - padding)
  const maxTop = Math.max(padding, viewport.height - tooltip.height - padding)

  return {
    left: Math.min(Math.max(padding, position.left), maxLeft),
    top: Math.min(Math.max(padding, position.top), maxTop),
  }
}

export function computeTooltipPosition(input: {
  anchorRect: Rect
  tooltipSize: Size
  viewport: Viewport
  gap?: number
}): { left: number; top: number; placement: TooltipPlacement } {
  const gap = input.gap ?? TOOLTIP_GAP
  const centerX = input.anchorRect.left + input.anchorRect.width / 2
  const centerY = input.anchorRect.top + input.anchorRect.height / 2

  let placement = getTooltipPlacement(centerX, centerY, input.viewport)
  let position = positionForPlacement(input.anchorRect, input.tooltipSize, placement, gap)

  if (!fitsInViewport(position, input.tooltipSize, input.viewport)) {
    placement = { ...placement, side: flipSide(placement.side) }
    position = positionForPlacement(input.anchorRect, input.tooltipSize, placement, gap)
  }

  return {
    ...clampPosition(position, input.tooltipSize, input.viewport),
    placement,
  }
}
