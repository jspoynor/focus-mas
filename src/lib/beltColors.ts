import { MAX_STAGE_MINUTES, MIN_STAGE_MINUTES, STAGE_INCREMENT } from './mastery'

export const BELT_HEX = [
  '#FFF8E7', // 25 min — cream
  '#FFE680', // 30 min
  '#FFD700', // 35 min
  '#FFA500', // 40 min
  '#FF6B35', // 45 min
  '#A8D400', // 50 min
  '#4CAF50', // 55 min
  '#26A69A', // 60 min
  '#29B6F6', // 65 min
  '#5C6BC0', // 70 min
  '#AB47BC', // 75 min
  '#8D5524', // 80 min
  '#2C1503', // 85 min — espresso
  '#1A1A1A', // 90 min — charcoal
] as const

/** Today marker outline on the contribution calendar. */
export const TODAY_MARKER_COLOR = '#bd2600'

const MIN_CELL_OPACITY = 0.2
const OPACITY_RANGE = 0.8

export function getStageColor(stageMinutes: number): string {
  const stageIndex = Math.round((stageMinutes - MIN_STAGE_MINUTES) / STAGE_INCREMENT)
  const colorIndex = Math.min(Math.max(stageIndex, 0), BELT_HEX.length - 1)
  return BELT_HEX[colorIndex]
}

export function getStageLadder(): { minutes: number; color: string }[] {
  const count = (MAX_STAGE_MINUTES - MIN_STAGE_MINUTES) / STAGE_INCREMENT + 1
  return Array.from({ length: count }, (_, index) => {
    const minutes = MIN_STAGE_MINUTES + index * STAGE_INCREMENT
    return { minutes, color: getStageColor(minutes) }
  })
}

/** Maps a day's uninterrupted rate to calendar cell opacity (20%–100%). */
export function getUninterruptedOpacity(uninterruptedRate: number): number {
  return MIN_CELL_OPACITY + OPACITY_RANGE * uninterruptedRate
}

export function getCalendarCellFill(longestDurationMinutes: number, uninterruptedRate: number): string {
  const color = getStageColor(longestDurationMinutes)
  return hexToRgba(color, getUninterruptedOpacity(uninterruptedRate))
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
