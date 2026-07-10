import { getStageColor } from '../lib/beltColors'
import { STREAK_TARGET } from '../lib/mastery'

interface DemoStreakBarProps {
  streak: number
  stageMinutes: number
}

/**
 * The app's `StreakBar` reads the store; this renders the same five segments from props.
 * Colors still come from `getStageColor`, so the page cannot drift from the belt ladder.
 */
export function DemoStreakBar({ streak, stageMinutes }: DemoStreakBarProps) {
  const stageColor = getStageColor(stageMinutes)

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/70">
        {streak}/{STREAK_TARGET}
      </p>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuenow={streak}
        aria-valuemin={0}
        aria-valuemax={STREAK_TARGET}
        aria-label="Uninterrupted session streak toward next level"
      >
        {Array.from({ length: STREAK_TARGET }, (_, index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded-full bg-white/10 transition-colors duration-500"
            style={index < streak ? { backgroundColor: stageColor } : undefined}
          />
        ))}
      </div>
    </div>
  )
}
