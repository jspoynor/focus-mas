import type { FocusSession } from '../types'

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface DaySessionStats {
  dateKey: string
  date: Date
  sessions: FocusSession[]
  completedCount: number
  cleanCount: number
  cleanRate: number | null
  longestDurationMinutes: number | null
}

export function groupSessionsByDay(sessions: FocusSession[]): Map<string, FocusSession[]> {
  const byDay = new Map<string, FocusSession[]>()

  for (const session of sessions) {
    const date = new Date(session.completedAt)
    const key = toDateKey(date)
    const existing = byDay.get(key) ?? []
    existing.push(session)
    byDay.set(key, existing)
  }

  for (const daySessions of byDay.values()) {
    daySessions.sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    )
  }

  return byDay
}

export function getDayStats(date: Date, sessions: FocusSession[]): DaySessionStats {
  const dateKey = toDateKey(date)
  const completedCount = sessions.length
  const cleanCount = sessions.filter((session) => !session.distracted).length
  const cleanRate = completedCount > 0 ? cleanCount / completedCount : null
  const longestDurationMinutes =
    completedCount > 0 ? Math.max(...sessions.map((session) => session.durationMinutes)) : null

  return {
    dateKey,
    date,
    sessions,
    completedCount,
    cleanCount,
    cleanRate,
    longestDurationMinutes,
  }
}

export function formatUninterruptedPercent(uninterruptedRate: number): string {
  return `${Math.round(uninterruptedRate * 100)}%`
}

export function formatDaySummaryLine(stats: DaySessionStats): string | null {
  if (stats.longestDurationMinutes === null || stats.cleanRate === null) return null
  return `Longest: ${stats.longestDurationMinutes} min · ${formatUninterruptedPercent(stats.cleanRate)} uninterrupted`
}

/** Seven full months centered on today: monthsBefore + current + monthsAfter. */
export interface CalendarMonth {
  year: number
  month: number
  label: string
  weeks: (Date | null)[][]
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = []

  for (let i = 0; i < firstOfMonth.getDay(); i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= lastDay; day++) {
    currentWeek.push(new Date(year, month, day))
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

export function buildCalendarMonths(
  monthsBefore = 3,
  monthsAfter = 3,
): CalendarMonth[] {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBefore, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + monthsAfter, 1)

  const months: CalendarMonth[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const labelDate = new Date(year, month, 1)

    months.push({
      year,
      month,
      label: labelDate.toLocaleDateString(undefined, {
        month: 'long',
      }),
      weeks: buildMonthGrid(year, month),
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function formatSessionAnswer(value: boolean): string {
  return value ? 'yes' : 'no'
}

export function formatSessionTooltipLine(session: FocusSession): string {
  return `${session.durationMinutes} min · distracted: ${formatSessionAnswer(session.q1Distracted ?? false)} · phone: ${formatSessionAnswer(session.q2UsedPhone ?? false)}`
}
