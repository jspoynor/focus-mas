import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  buildCalendarMonths,
  groupSessionsByDay,
  isPlannerSnapshotEligible,
  isSameDay,
  toDateKey,
} from '../../lib/calendarGrid'
import { usePlannerSnapshot } from '../../hooks/usePlannerSnapshot'
import { surveyCompleteSessions } from '../../lib/mastery'
import {
  computeProjectedAdvancementDate,
  formatProjectedDateLabel,
  projectedDateKey,
} from '../../lib/projectedDate'
import { MasteryDetails, MasteryStage } from '../mastery/MasteryInsights'
import { useAppStore } from '../../store/useAppStore'
import { CalendarDayCell } from './CalendarDayCell'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const INITIAL_MONTHS_BEFORE = 3
const INITIAL_MONTHS_AFTER = 3
const MONTHS_LOAD_CHUNK = 3
const SCROLL_EDGE_MARGIN = '120px 0px'

export function ContributionCalendar() {
  const sessions = useAppStore((s) => s.sessions)
  const progress = useAppStore((s) => s.progress)
  const { openSnapshot, returnToToday } = usePlannerSnapshot()
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const hasScrolledToTodayRef = useRef(false)
  const prependAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null)
  const isExpandingPastRef = useRef(false)
  const isExpandingFutureRef = useRef(false)
  const [monthsBefore, setMonthsBefore] = useState(INITIAL_MONTHS_BEFORE)
  const [monthsAfter, setMonthsAfter] = useState(INITIAL_MONTHS_AFTER)

  const calendar = useMemo(() => {
    const completeSessions = surveyCompleteSessions(sessions)
    const months = buildCalendarMonths(monthsBefore, monthsAfter)
    const sessionsByDay = groupSessionsByDay(completeSessions)
    const stageMinutes = progress?.currentStageMinutes ?? 25
    const projectedDate = computeProjectedAdvancementDate(completeSessions, stageMinutes)
    const projectedKey = projectedDateKey(projectedDate)
    const projectedLabel = projectedDate ? formatProjectedDateLabel(projectedDate) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      months,
      sessionsByDay,
      projectedKey,
      projectedLabel,
      today,
    }
  }, [sessions, progress, monthsBefore, monthsAfter])

  const expandPast = useCallback(() => {
    if (isExpandingPastRef.current) return

    const container = scrollRef.current
    if (!container) return

    isExpandingPastRef.current = true
    prependAnchorRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    }
    setMonthsBefore((count) => count + MONTHS_LOAD_CHUNK)
  }, [])

  const expandFuture = useCallback(() => {
    if (isExpandingFutureRef.current) return
    isExpandingFutureRef.current = true
    setMonthsAfter((count) => count + MONTHS_LOAD_CHUNK)
  }, [])

  const todayKey = toDateKey(calendar.today)

  const handlePlannerDayClick = useCallback(
    (dateKey: string) => {
      if (dateKey === todayKey) {
        void returnToToday()
        return
      }
      void openSnapshot(dateKey)
    },
    [openSnapshot, returnToToday, todayKey],
  )

  useLayoutEffect(() => {
    const container = scrollRef.current
    const anchor = prependAnchorRef.current
    if (!container || !anchor) return

    const heightDelta = container.scrollHeight - anchor.scrollHeight
    container.scrollTop = anchor.scrollTop + heightDelta
    prependAnchorRef.current = null
    isExpandingPastRef.current = false
  }, [monthsBefore])

  useLayoutEffect(() => {
    isExpandingFutureRef.current = false
  }, [monthsAfter])

  useLayoutEffect(() => {
    if (hasScrolledToTodayRef.current) return

    const container = scrollRef.current
    if (!container) return

    const todayEl = container.querySelector(`[data-calendar-day="${todayKey}"]`)
    if (todayEl instanceof HTMLElement) {
      todayEl.scrollIntoView({ block: 'center', behavior: 'instant' })
      hasScrolledToTodayRef.current = true
    }
  }, [todayKey, calendar.months])

  useEffect(() => {
    const root = scrollRef.current
    const topSentinel = topSentinelRef.current
    const bottomSentinel = bottomSentinelRef.current
    if (!root || !topSentinel || !bottomSentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.target === topSentinel) expandPast()
          else if (entry.target === bottomSentinel) expandFuture()
        }
      },
      { root, rootMargin: SCROLL_EDGE_MARGIN, threshold: 0 },
    )

    observer.observe(topSentinel)
    observer.observe(bottomSentinel)

    return () => observer.disconnect()
  }, [expandPast, expandFuture, calendar.months.length])

  return (
    <section
      className="glass-panel min-h-0 min-w-0 flex-1 overflow-hidden rounded-glass-lg p-6 max-lg:min-h-0 max-lg:flex-[1.5]"
      aria-label="Contribution calendar"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <MasteryStage />

        <div className="grid shrink-0 grid-cols-7 gap-1 text-[10px] text-white/40">
          {WEEKDAY_LABELS.map((weekday) => (
            <div key={weekday} className="text-center">
              {weekday.charAt(0)}
            </div>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="calendar-scroll mt-1 min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          <div className="calendar-scroll-inner flex flex-col gap-4">
            <div ref={topSentinelRef} className="h-px shrink-0" aria-hidden="true" />
            {calendar.months.map((month, index) => {
              const isFirstMonthOfYear =
                index === 0 || month.year !== calendar.months[index - 1].year

              return (
                <div key={`${month.year}-${month.month}`}>
                  {isFirstMonthOfYear ? (
                    <p className="mb-2 mt-1 text-sm font-medium text-white/80">{month.year}</p>
                  ) : null}
                  <p className="mb-2 text-xs font-medium text-white/70">{month.label}</p>
                  <div className="grid grid-cols-7 gap-1">
                    {month.weeks.flatMap((week, weekIndex) =>
                      week.map((day, dayIndex) => {
                        if (!day) {
                          return (
                            <div
                              key={`${month.year}-${month.month}-${weekIndex}-${dayIndex}`}
                              className="aspect-square min-h-0 min-w-0"
                              aria-hidden="true"
                            />
                          )
                        }

                        const dateKey = toDateKey(day)
                        const daySessions = calendar.sessionsByDay.get(dateKey) ?? []
                        const isPlannerClickable = isPlannerSnapshotEligible(day, calendar.today)

                        return (
                          <CalendarDayCell
                            key={dateKey}
                            date={day}
                            sessions={daySessions}
                            isToday={isSameDay(day, calendar.today)}
                            isProjectedDate={calendar.projectedKey === dateKey}
                            projectedDateLabel={calendar.projectedLabel}
                            isPlannerClickable={isPlannerClickable}
                            onPlannerDayClick={handlePlannerDayClick}
                          />
                        )
                      }),
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomSentinelRef} className="h-px shrink-0" aria-hidden="true" />
          </div>
        </div>

        <MasteryDetails />
      </div>
    </section>
  )
}
