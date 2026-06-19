import { describe, expect, it } from 'vitest'
import {
  computeTooltipPosition,
  fitsInViewport,
  getThirdZone,
  getTooltipPlacement,
  positionForPlacement,
  TOOLTIP_GAP,
} from './tooltipPosition'

const viewport = { width: 900, height: 600 }

describe('getThirdZone', () => {
  it('uses left/top inclusive boundaries', () => {
    expect(getThirdZone(0, 900)).toBe(0)
    expect(getThirdZone(299, 900)).toBe(0)
    expect(getThirdZone(300, 900)).toBe(0)
    expect(getThirdZone(301, 900)).toBe(1)
    expect(getThirdZone(600, 900)).toBe(1)
    expect(getThirdZone(601, 900)).toBe(2)
    expect(getThirdZone(599, 900)).toBe(1)
  })
})

describe('getTooltipPlacement', () => {
  it('places tooltips beside left and right columns', () => {
    expect(getTooltipPlacement(100, 300, viewport)).toEqual({ side: 'right', align: 'center' })
    expect(getTooltipPlacement(800, 100, viewport)).toEqual({ side: 'left', align: 'start' })
    expect(getTooltipPlacement(800, 500, viewport)).toEqual({ side: 'left', align: 'end' })
  })

  it('places tooltips above or below the center column', () => {
    expect(getTooltipPlacement(450, 100, viewport)).toEqual({ side: 'below', align: 'start' })
    expect(getTooltipPlacement(450, 300, viewport)).toEqual({ side: 'above', align: 'center' })
    expect(getTooltipPlacement(450, 500, viewport)).toEqual({ side: 'above', align: 'end' })
  })
})

describe('positionForPlacement', () => {
  const anchor = { left: 400, top: 200, width: 40, height: 40 }
  const tooltip = { width: 120, height: 60 }

  it('positions to the left with vertical center alignment', () => {
    const position = positionForPlacement(
      anchor,
      tooltip,
      { side: 'left', align: 'center' },
      TOOLTIP_GAP,
    )

    expect(position.left).toBe(anchor.left - TOOLTIP_GAP - tooltip.width)
    expect(position.top).toBe(anchor.top + anchor.height / 2 - tooltip.height / 2)
  })

  it('positions below with start alignment', () => {
    const position = positionForPlacement(
      anchor,
      tooltip,
      { side: 'below', align: 'start' },
      TOOLTIP_GAP,
    )

    expect(position.left).toBe(anchor.left)
    expect(position.top).toBe(anchor.top + anchor.height + TOOLTIP_GAP)
  })
})

describe('computeTooltipPosition', () => {
  it('flips to the opposite side when the preferred side overflows', () => {
    const anchorRect = { left: 10, top: 280, width: 32, height: 32 }
    const tooltipSize = { width: 200, height: 80 }

    const result = computeTooltipPosition({ anchorRect, tooltipSize, viewport })

    expect(result.placement.side).toBe('right')
    expect(result.left).toBe(anchorRect.left + anchorRect.width + TOOLTIP_GAP)
    expect(fitsInViewport(result, tooltipSize, viewport)).toBe(true)
  })

  it('clamps within the viewport after flipping', () => {
    const anchorRect = { left: 860, top: 10, width: 24, height: 24 }
    const tooltipSize = { width: 180, height: 96 }

    const result = computeTooltipPosition({ anchorRect, tooltipSize, viewport })

    expect(result.placement.side).toBe('left')
    expect(result.top).toBeGreaterThanOrEqual(0)
    expect(result.left).toBeGreaterThanOrEqual(0)
    expect(result.left + tooltipSize.width).toBeLessThanOrEqual(viewport.width)
    expect(result.top + tooltipSize.height).toBeLessThanOrEqual(viewport.height)
  })
})
