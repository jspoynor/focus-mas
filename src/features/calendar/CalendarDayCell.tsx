import { useId } from 'react'
import { getBeltColor, TODAY_MARKER_COLOR } from '../../lib/beltColors'
import { formatSessionTooltipLine, getDayStats, toDateKey, type DaySessionStats } from '../../lib/calendarGrid'
import type { FocusSession } from '../../types'

interface CalendarDayCellProps {
  date: Date
  sessions: FocusSession[]
  isToday: boolean
  isProjectedDate: boolean
  projectedDateLabel: string | null
}

export function CalendarDayCell({
  date,
  sessions,
  isToday,
  isProjectedDate,
  projectedDateLabel,
}: CalendarDayCellProps) {
  const tooltipId = useId()
  const markerTooltipId = useId()
  const stats: DaySessionStats = getDayStats(date, sessions)
  const hasSessions = stats.completedCount > 0
  const fillColor = stats.cleanRate !== null ? getBeltColor(stats.cleanRate) : undefined
  const isFocusable = hasSessions || isToday || isProjectedDate

  const markerText = isToday
    ? 'Today'
    : isProjectedDate && projectedDateLabel
      ? projectedDateLabel
      : null

  const cellStyle = {
    ...(fillColor ? { backgroundColor: fillColor } : {}),
    boxShadow: buildDayOutlineShadow(isToday, isProjectedDate),
  }

  const cellClassName =
    'absolute inset-0 m-0 min-h-0 rounded-sm border-0 p-0 transition-colors'

  const cellSurfaceClassName = `${cellClassName} ${
    hasSessions ? '' : 'bg-white/5'
  }`

  return (
    <div className="group relative aspect-square min-h-0 min-w-0" data-calendar-day={toDateKey(date)}>
      {isFocusable ? (
        <button
          type="button"
          className={`${cellSurfaceClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset`}
          style={cellStyle}
          aria-label={buildAriaLabel(date, stats, isToday, isProjectedDate)}
          aria-describedby={
            [markerText ? markerTooltipId : null, hasSessions ? tooltipId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
      ) : (
        <div className={cellSurfaceClassName} style={cellStyle} aria-hidden="true" />
      )}

      {markerText ? (
        <div
          id={markerTooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-52 -translate-x-1/2 rounded-glass border border-white/15 bg-slate-900/95 px-3 py-2 text-center text-xs text-white/90 shadow-lg group-hover:block group-focus-within:block"
        >
          {markerText}
        </div>
      ) : null}

      {hasSessions ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-glass border border-white/15 bg-slate-900/95 px-3 py-2 text-left text-xs text-white/90 shadow-lg group-hover:block group-focus-within:block"
        >
          <p className="font-medium text-white">
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <ul className="mt-1 space-y-1">
            {stats.sessions.map((session) => (
              <li key={session.id} className="text-white/75">
                {formatSessionTooltipLine(session)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function buildDayOutlineShadow(isToday: boolean, isProjectedDate: boolean): string {
  if (isToday) {
    return `inset 0 0 0 2px ${TODAY_MARKER_COLOR}`
  }
  if (isProjectedDate) {
    return 'inset 0 0 0 2px rgba(255, 255, 255, 0.9)'
  }
  return 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
}

function buildAriaLabel(
  date: Date,
  stats: DaySessionStats,
  isToday: boolean,
  isProjectedDate: boolean,
): string {
  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const markers = [
    isToday ? 'today' : null,
    isProjectedDate ? 'projected advancement date' : null,
  ].filter(Boolean)

  if (!stats.completedCount) {
    return markers.length > 0 ? `${dateLabel}, ${markers.join(', ')}, no sessions` : `${dateLabel}, no sessions`
  }

  const rate = Math.round((stats.cleanRate ?? 0) * 100)
  const markerSuffix = markers.length > 0 ? `, ${markers.join(', ')}` : ''
  return `${dateLabel}, ${stats.completedCount} sessions, ${rate}% clean${markerSuffix}`
}
