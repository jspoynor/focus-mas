import { AppLayout } from './components/AppLayout'
import { ContributionCalendar } from './features/calendar/ContributionCalendar'
import { MasteryEnginePlaceholder } from './features/mastery/MasteryEnginePlaceholder'
import { PostSessionSurvey } from './features/survey/PostSessionSurvey'
import { Timer } from './features/timer/Timer'

function App() {
  return (
    <AppLayout>
      <MasteryEnginePlaceholder />
      <div className="grid gap-6 lg:grid-cols-2">
        <Timer />
        <PostSessionSurvey />
      </div>
      <div className="mt-6">
        <ContributionCalendar />
      </div>
    </AppLayout>
  )
}

export default App
