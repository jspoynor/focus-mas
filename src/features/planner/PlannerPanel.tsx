import {
  canFocusGoNext,
  canFocusGoPrev,
  formatFocusSessionHeader,
  getFocusPageText,
  isFocusDraftPage,
} from '../../lib/plannerPages'
import { useAppStore } from '../../store/useAppStore'

const PLANNER_TEXTAREA_CLASS =
  'min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm leading-relaxed text-white shadow-none placeholder:text-white/35 focus:border-0 focus:outline-none focus:ring-0 disabled:cursor-default disabled:text-white/80'

const SECTION_HEADER_CLASS = 'shrink-0 text-xs uppercase tracking-widest text-white/50'

const ARROW_BUTTON_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-glass text-base leading-none text-white/60 transition-colors hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30'

export function PlannerPanel() {
  const dayPlanDraft = useAppStore((s) => s.dayPlanDraft)
  const focusPlanDraft = useAppStore((s) => s.focusPlanDraft)
  const focusPageIndex = useAppStore((s) => s.focusPageIndex)
  const focusSnapshots = useAppStore((s) => s.focusSnapshots)
  const plannerViewMode = useAppStore((s) => s.plannerViewMode)
  const setDayPlanDraft = useAppStore((s) => s.setDayPlanDraft)
  const setFocusPlanDraft = useAppStore((s) => s.setFocusPlanDraft)
  const focusGoPrev = useAppStore((s) => s.focusGoPrev)
  const focusGoNext = useAppStore((s) => s.focusGoNext)

  const snapshotCount = focusSnapshots.length
  const focusHeader = formatFocusSessionHeader(focusPageIndex, snapshotCount, plannerViewMode)
  const focusText = getFocusPageText(
    focusPageIndex,
    focusSnapshots,
    focusPlanDraft,
    plannerViewMode,
  )
  const isFocusEditable = isFocusDraftPage(focusPageIndex, snapshotCount, plannerViewMode)
  const canPrev = canFocusGoPrev(focusPageIndex)
  const canNext = canFocusGoNext(focusPageIndex, snapshotCount, plannerViewMode)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="flex min-h-0 flex-[5] flex-col gap-2" aria-label="Day plan">
        <h2 className={SECTION_HEADER_CLASS}>Day plan</h2>
        <textarea
          className={PLANNER_TEXTAREA_CLASS}
          value={dayPlanDraft}
          onChange={(event) => setDayPlanDraft(event.target.value)}
          placeholder="What's on for today?"
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
        <textarea
          className={PLANNER_TEXTAREA_CLASS}
          value={focusText}
          onChange={(event) => {
            if (isFocusEditable) {
              setFocusPlanDraft(event.target.value)
            }
          }}
          readOnly={!isFocusEditable}
          placeholder="What will you focus on next?"
          aria-label="Focus session plan"
          aria-readonly={!isFocusEditable}
        />
      </section>
    </div>
  )
}
