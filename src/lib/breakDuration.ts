/** Break length: round(focusDuration × 0.2) to nearest 5 minutes. */
export function breakMinutes(focusDurationMinutes: number): number {
  return Math.round((focusDurationMinutes * 0.2) / 5) * 5
}
