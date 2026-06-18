import { PlannerPanel } from '../features/planner/PlannerPanel'

export function LeftPanel() {
  return (
    <section
      className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-glass-lg px-3 py-6 max-lg:flex-1"
      aria-label="Left panel"
    >
      <PlannerPanel />
    </section>
  )
}
