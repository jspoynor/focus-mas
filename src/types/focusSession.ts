/** Focus-length stage in minutes (e.g. 25 → 30 → …). */
export type FocusStageMinutes = number

export interface FocusSession {
  id: string
  startedAt: string
  completedAt: string
  durationMinutes: number
  stage: FocusStageMinutes
  q1Distracted: boolean | null
  q2UsedPhone: boolean | null
  distracted: boolean | null
}
