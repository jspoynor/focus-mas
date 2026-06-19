import { PlannerPanel } from '../features/planner/PlannerPanel'

export function LeftPanel() {
  return (
    <section
      className="glass-panel side-panel side-panel--planner flex flex-col rounded-glass-lg px-3 py-6"
      aria-label="Left panel"
    >
      <PlannerPanel />
    </section>
  )
}
