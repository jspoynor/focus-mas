import type { FocusStageMinutes } from './focusSession'

export interface UserProgress {
  currentStageMinutes: FocusStageMinutes
  lastProgressionAt: string | null
}
