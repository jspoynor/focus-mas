export interface FocusPlanSnapshot {
  sessionId: string
  planText: string
  startedAt: string
}

export interface PlannerDay {
  dateKey: string
  dayPlan: string
  focusSessions: FocusPlanSnapshot[]
  updatedAt: string | null
}
