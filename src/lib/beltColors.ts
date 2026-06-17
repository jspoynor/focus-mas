/** 13-step summer belt ladder — upper bounds for each band (exclusive except last). */
const BELT_BANDS = [0.08, 0.15, 0.23, 0.31, 0.38, 0.46, 0.54, 0.62, 0.69, 0.77, 0.85, 0.92, 1.01] as const

const BELT_HEX = [
  '#FFF8E7', // 0–8% cream
  '#FFE680', // 8–15%
  '#FFD700', // 15–23%
  '#FFA500', // 23–31%
  '#FF6B35', // 31–38%
  '#A8D400', // 38–46%
  '#4CAF50', // 46–54%
  '#26A69A', // 54–62%
  '#29B6F6', // 62–69%
  '#5C6BC0', // 69–77%
  '#AB47BC', // 77–85%
  '#8D5524', // 85–92%
  '#2C1503', // 92–100%
] as const

/** Warm orange belt step — today marker on the contribution calendar. */
export const TODAY_MARKER_COLOR = '#FF6B35'

export function getBeltColor(cleanRate: number): string {
  for (let i = 0; i < BELT_BANDS.length; i++) {
    if (cleanRate < BELT_BANDS[i]) {
      return BELT_HEX[i]
    }
  }
  return BELT_HEX[BELT_HEX.length - 1]
}
