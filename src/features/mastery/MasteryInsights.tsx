import { useMemo } from 'react'
import { HoverTooltipSection } from '../../components/HoverTooltipSection'
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

  return (
    <HoverTooltipSection className="shrink-0 outline-none" tooltip={<FocusLevelTooltipContent />}>
      <p className="text-[10px] uppercase tracking-widest text-white/40">Focus level</p>
      <p
        className="text-xl font-light transition-colors duration-500"
        style={{ color: stageColor }}
      >
        {stageMinutes} min
      </p>
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
