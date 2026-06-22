import { useId, useRef, useState, type FocusEvent } from 'react'
import { FloatingTooltip } from '../../components/FloatingTooltip'
import { getCalendarCellFill, TODAY_MARKER_COLOR } from '../../lib/beltColors'
import {
  formatDaySummaryLine,
  formatSessionTooltipLine,
  formatUninterruptedPercent,
  getDayStats,
  toDateKey,
  type DaySessionStats,
} from '../../lib/calendarGrid'
import type { FocusSession } from '../../types'

interface CalendarDayCellProps {
  date: Date
  sessions: FocusSession[]
  isToday: boolean
  isPlannerClickable: boolean
  onPlannerDayClick?: (dateKey: string) => void
}

export function CalendarDayCell({
  date,
  sessions,
  isToday,
  isPlannerClickable,
  onPlannerDayClick,
}: CalendarDayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipId = useId()
  const stats: DaySessionStats = getDayStats(date, sessions)
  const hasSessions = stats.completedCount > 0
  const fillColor =
    stats.longestDurationMinutes !== null && stats.cleanRate !== null
      ? getCalendarCellFill(stats.longestDurationMinutes, stats.cleanRate)
      : undefined
  const isFocusable = hasSessions || isToday || isPlannerClickable
  const dateKey = toDateKey(date)
  const summaryLine = formatDaySummaryLine(stats)

  const markerText = isToday ? 'Today' : null

  const hasTooltipContent = markerText !== null || hasSessions

  const cellStyle = {
    ...(fillColor ? { backgroundColor: fillColor } : {}),
    boxShadow: buildDayOutlineShadow(isToday),
  }

  const cellClassName =
    'absolute inset-0 m-0 min-h-0 rounded-sm border-0 p-0 transition-[background-color,box-shadow] duration-300'

  const cellSurfaceClassName = `${cellClassName} ${
    hasSessions ? '' : 'bg-white/5'
  }`

  const showTooltip = () => setTooltipOpen(true)
  const hideTooltip = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setTooltipOpen(false)
    }
  }

  return (
    <div
      ref={cellRef}
      className="group relative aspect-square min-h-0 min-w-0"
      data-calendar-day={toDateKey(date)}
      onMouseEnter={showTooltip}
      onMouseLeave={() => setTooltipOpen(false)}
      onFocusCapture={showTooltip}
      onBlurCapture={hideTooltip}
    >
      {isFocusable ? (
        <button
          type="button"
          className={`${cellSurfaceClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset`}
          style={cellStyle}
          aria-label={buildAriaLabel(date, stats, isToday, isPlannerClickable)}
          aria-describedby={hasTooltipContent && tooltipOpen ? tooltipId : undefined}
          onClick={
            isPlannerClickable
              ? () => {
                  onPlannerDayClick?.(dateKey)
                }
              : undefined
          }
        />
      ) : (
        <div className={cellSurfaceClassName} style={cellStyle} aria-hidden="true" />
      )}

      {hasTooltipContent ? (
        <FloatingTooltip
          anchorRef={cellRef}
          open={tooltipOpen}
          id={tooltipId}
          textAlign="left"
        >
          {markerText ? <p className="font-medium text-white">{markerText}</p> : null}
          {hasSessions ? (
            <>
              {!markerText ? (
                <p className="font-medium text-white">
                  {date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              ) : null}
              {summaryLine ? <p className="mt-1 text-white/75">{summaryLine}</p> : null}
              <ul className="mt-1 space-y-1">
                {stats.sessions.map((session) => (
                  <li key={session.id} className="text-white/75">
                    {formatSessionTooltipLine(session)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </FloatingTooltip>
      ) : null}
    </div>
  )
}

function buildDayOutlineShadow(isToday: boolean): string {
  if (isToday) {
    return `inset 0 0 0 2px ${TODAY_MARKER_COLOR}`
  }
  return 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
}

function buildAriaLabel(
  date: Date,
  stats: DaySessionStats,
  isToday: boolean,
  isPlannerClickable: boolean,
): string {
  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  const markers = [
    isToday ? 'today' : null,
    isToday && isPlannerClickable ? 'return to live planning' : null,
    !isToday && isPlannerClickable ? 'open planner snapshot' : null,
  ].filter(Boolean)

  if (!stats.completedCount) {
    return markers.length > 0 ? `${dateLabel}, ${markers.join(', ')}, no sessions` : `${dateLabel}, no sessions`
  }

  const uninterrupted = formatUninterruptedPercent(stats.cleanRate ?? 0)
  const markerSuffix = markers.length > 0 ? `, ${markers.join(', ')}` : ''
  return `${dateLabel}, ${stats.completedCount} sessions, longest ${stats.longestDurationMinutes} min, ${uninterrupted} uninterrupted${markerSuffix}`
}
