import { useId, useRef, useState } from 'react'
import {
  canFocusGoNext,
  canFocusGoPrev,
  FOCUS_SESSION_OUTCOME_LABELS,
  formatFocusSessionHeader,
  getFocusPageSnapshot,
  getFocusPageText,
  getFocusSessionOutcomeStatus,
  isFocusDraftPage,
  isFocusSnapshotPage,
  shouldShowFocusSessionOutcome,
} from '../../lib/plannerPages'
import { useFocusPageSync } from '../../hooks/useFocusPageSync'
import { useAppStore } from '../../store/useAppStore'
import { CalendarFloatingTooltip } from '../calendar/CalendarFloatingTooltip'
import { PlannerMarkdownEditor } from './PlannerMarkdownEditor'

const PLANNER_TEXTAREA_CLASS =
  'min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm leading-relaxed text-white shadow-none placeholder:text-white/35 focus:border-0 focus:outline-none focus:ring-0 disabled:cursor-default disabled:text-white/80'

const SECTION_HEADER_CLASS = 'shrink-0 text-xs uppercase tracking-widest text-white/50'

const ARROW_BUTTON_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-glass text-base leading-none text-white/60 transition-colors hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30'

export function PlannerPanel() {
  useFocusPageSync()

  const dayPlanHeaderRef = useRef<HTMLHeadingElement>(null)
  const [dayPlanTooltipOpen, setDayPlanTooltipOpen] = useState(false)
  const dayPlanTooltipId = useId()

  const dayPlanDraft = useAppStore((s) => s.dayPlanDraft)
  const focusPlanDraft = useAppStore((s) => s.focusPlanDraft)
  const focusPageIndex = useAppStore((s) => s.focusPageIndex)
  const focusSnapshots = useAppStore((s) => s.focusSnapshots)
  const focusDraftSlotVisible = useAppStore((s) => s.focusDraftSlotVisible)
  const sessions = useAppStore((s) => s.sessions)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const pendingSurveySessionId = useAppStore((s) => s.pendingSurveySessionId)
  const plannerViewMode = useAppStore((s) => s.plannerViewMode)
  const userDataStatus = useAppStore((s) => s.userDataStatus)
  const dayPlanSaveStatus = useAppStore((s) => s.dayPlanSaveStatus)
  const timerMode = useAppStore((s) => s.timerMode)
  const surveyActive = useAppStore((s) => s.surveyActive)
  const setDayPlanDraft = useAppStore((s) => s.setDayPlanDraft)
  const setFocusPlanDraft = useAppStore((s) => s.setFocusPlanDraft)
  const focusGoPrev = useAppStore((s) => s.focusGoPrev)
  const focusGoNext = useAppStore((s) => s.focusGoNext)

  const isLiveMode = plannerViewMode === 'live'
  const isSnapshotMode = plannerViewMode === 'snapshot'
  const snapshotCount = focusSnapshots.length
  const focusSessionLocked = timerMode === 'focus' || surveyActive
  const isPlannerReady = userDataStatus === 'ready'
  const isDayPlanEditable = isLiveMode && isPlannerReady
  const dayPlanPlaceholder = isSnapshotMode
    ? 'No day plan recorded'
    : "What's on for today?"
  const focusPlaceholder =
    isSnapshotMode && snapshotCount === 0
      ? 'No focus plans recorded'
      : 'What will you focus on next?'
  const dayPlanSaveLabel =
    dayPlanSaveStatus === 'pending'
      ? 'Saving…'
      : dayPlanSaveStatus === 'saved'
        ? 'Saved'
        : dayPlanSaveStatus === 'error'
          ? 'Save failed'
          : null

  const focusHeader = formatFocusSessionHeader(
    focusPageIndex,
    snapshotCount,
    plannerViewMode,
    focusDraftSlotVisible,
  )
  const focusText = getFocusPageText(
    focusPageIndex,
    focusSnapshots,
    focusPlanDraft,
    plannerViewMode,
    focusDraftSlotVisible,
  )
  const isFocusEditable =
    isFocusDraftPage(focusPageIndex, snapshotCount, plannerViewMode, focusDraftSlotVisible) &&
    isLiveMode &&
    isPlannerReady &&
    !focusSessionLocked
  const isFocusReadOnly =
    isFocusSnapshotPage(focusPageIndex, snapshotCount, plannerViewMode, focusDraftSlotVisible) ||
    !isFocusEditable
  const canPrev = isPlannerReady && canFocusGoPrev(focusPageIndex)
  const canNext =
    isPlannerReady &&
    canFocusGoNext(focusPageIndex, snapshotCount, plannerViewMode, focusDraftSlotVisible)
  const focusPageSnapshot = getFocusPageSnapshot(
    focusPageIndex,
    focusSnapshots,
    plannerViewMode,
    focusDraftSlotVisible,
  )
  const focusOutcomeLabel =
    focusPageSnapshot &&
    shouldShowFocusSessionOutcome(
      focusPageIndex,
      snapshotCount,
      plannerViewMode,
      focusPageSnapshot.sessionId,
      activeSessionId,
      focusDraftSlotVisible,
    )
      ? FOCUS_SESSION_OUTCOME_LABELS[
          getFocusSessionOutcomeStatus(
            focusPageSnapshot.sessionId,
            sessions,
            pendingSurveySessionId,
          )
        ]
      : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="flex min-h-0 flex-[5] flex-col gap-2" aria-label="Day plan">
        <div className="flex shrink-0 items-baseline justify-between gap-2">
          <h2
            ref={dayPlanHeaderRef}
            className={`${SECTION_HEADER_CLASS} w-fit`}
            aria-describedby={dayPlanTooltipOpen ? dayPlanTooltipId : undefined}
            onMouseEnter={() => setDayPlanTooltipOpen(true)}
            onMouseLeave={() => setDayPlanTooltipOpen(false)}
            onFocus={() => setDayPlanTooltipOpen(true)}
            onBlur={() => setDayPlanTooltipOpen(false)}
            tabIndex={0}
          >
            Day plan
          </h2>
          <CalendarFloatingTooltip
            anchorRef={dayPlanHeaderRef}
            open={dayPlanTooltipOpen}
            id={dayPlanTooltipId}
            textAlign="left"
          >
            <p>Planning out the day and creating plans before focus sessions.</p>
            <p className="mt-2 text-white/75">
              Tip: use - , 1. , and [ ] commands to organize your plans.
            </p>
          </CalendarFloatingTooltip>
          {dayPlanSaveLabel && isLiveMode ? (
            <span className="text-[10px] uppercase tracking-wider text-white/35" aria-live="polite">
              {dayPlanSaveLabel}
            </span>
          ) : null}
        </div>
        <PlannerMarkdownEditor
          className={PLANNER_TEXTAREA_CLASS}
          value={dayPlanDraft}
          onChange={(nextValue) => {
            if (isDayPlanEditable) {
              setDayPlanDraft(nextValue)
            }
          }}
          readOnly={!isDayPlanEditable}
          placeholder={dayPlanPlaceholder}
          aria-label="Day plan"
        />
      </section>

      <section className="flex min-h-0 flex-[3] flex-col gap-2" aria-label="Focus session plan">
        <div className="grid shrink-0 grid-cols-[2rem_1fr_2rem] items-center gap-1">
          <button
            type="button"
            className={`${ARROW_BUTTON_CLASS} justify-self-start`}
            onClick={focusGoPrev}
            disabled={!canPrev}
            aria-label="Previous focus session plan"
          >
            ‹
          </button>
          <h2 className={`${SECTION_HEADER_CLASS} text-center`}>{focusHeader}</h2>
          <button
            type="button"
            className={`${ARROW_BUTTON_CLASS} justify-self-end`}
            onClick={focusGoNext}
            disabled={!canNext}
            aria-label="Next focus session plan"
          >
            ›
          </button>
        </div>
        {focusOutcomeLabel ? (
          <p
            className="shrink-0 text-[10px] uppercase tracking-wider text-white/40"
            aria-live="polite"
          >
            {focusOutcomeLabel}
          </p>
        ) : null}
        <PlannerMarkdownEditor
          className={PLANNER_TEXTAREA_CLASS}
          value={focusText}
          onChange={(nextValue) => {
            if (isFocusEditable) {
              setFocusPlanDraft(nextValue)
            }
          }}
          readOnly={isFocusReadOnly}
          placeholder={focusPlaceholder}
          aria-label="Focus session plan"
        />
      </section>
    </div>
  )
}
