import { useMemo } from 'react'
import { HoverTooltipSection } from '../../components/HoverTooltipSection'
import { CrownIcon } from '../../components/CrownIcon'
import {
  computeCurrentStreak,
  isAtMaxStage,
  STREAK_TARGET,
} from '../../lib/mastery'
import { useAppStore } from '../../store/useAppStore'
import { getStageColor } from '../../lib/beltColors'
import { FocusLevelTooltipContent, StreakTooltipContent } from './masteryTooltips'

export function MasteryStage() {
  const progress = useAppStore((s) => s.progress)
  const stageMinutes = progress?.currentStageMinutes ?? 25
  const stageColor = getStageColor(stageMinutes)
  const isMaxStage = stageMinutes === 90

  return (
    <HoverTooltipSection className="shrink-0 outline-none" tooltip={<FocusLevelTooltipContent />}>
      <p className="text-[10px] uppercase tracking-widest text-white/40">Focus level</p>
      <div className="flex items-center gap-2">
        <div
          className="relative aspect-square h-5 shrink-0 rounded-sm"
          style={{
            backgroundColor: stageColor,
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {isMaxStage && (
            <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
              <div className="h-4 w-4">
                <CrownIcon opacity={0.15} />
              </div>
            </div>
          )}
        </div>
        <p className="text-xl font-light text-white">
          {stageMinutes} min
        </p>
      </div>
    </HoverTooltipSection>
  )
}

export function StreakBar() {
  const sessions = useAppStore((s) => s.sessions)
  const progress = useAppStore((s) => s.progress)
  const stageMinutes = progress?.currentStageMinutes ?? 25
  const stageColor = getStageColor(stageMinutes)

  const streak = useMemo(
    () => computeCurrentStreak(sessions, progress?.lastProgressionAt ?? null),
    [sessions, progress?.lastProgressionAt],
  )

  const atMax = isAtMaxStage(stageMinutes)
  const filledCount = atMax ? STREAK_TARGET : streak

  return (
    <HoverTooltipSection
      className="shrink-0 space-y-2 border-t border-white/10 pt-3 outline-none"
      tooltip={<StreakTooltipContent streak={streak} stageMinutes={stageMinutes} atMax={atMax} />}
    >
      <p className="text-xs text-white/70">{atMax ? 'Max level' : `${streak}/${STREAK_TARGET}`}</p>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuenow={filledCount}
        aria-valuemin={0}
        aria-valuemax={STREAK_TARGET}
        aria-label={
          atMax
            ? 'Maximum focus level reached'
            : 'Uninterrupted session streak toward next level'
        }
      >
        {Array.from({ length: STREAK_TARGET }, (_, index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded-full bg-white/10 transition-colors duration-500"
            style={
              index < filledCount
                ? { backgroundColor: stageColor }
                : undefined
            }
          />
        ))}
      </div>
    </HoverTooltipSection>
  )
}
