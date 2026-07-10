import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { CalendarSection } from './sections/CalendarSection'
import { CloseSection } from './sections/CloseSection'
import { Hero } from './sections/Hero'
import { LadderSection } from './sections/LadderSection'

/**
 * The signed-out view, at any path. `.marketing-shell` is its own scroll container nested
 * inside the `#root` overflow lock — the app's viewport lock stays untouched, and the
 * fixed `.app-shell` wallpaper parallaxes behind the scrolling content.
 */
export function MarketingPage() {
  return (
    <div className="app-shell marketing-shell">
      {/* Pinned to the viewport so it stays reachable from any section, not just the
          bottom CTA. Compact and error-free here; the CloseSection button surfaces errors. */}
      <GoogleSignInButton
        className="fixed right-4 top-4 z-30 sm:right-6"
        label="Sign in"
        fullWidth={false}
        showError={false}
      />
      <main>
        <Hero />
        <LadderSection />
        <CalendarSection />
        <CloseSection />
      </main>
    </div>
  )
}
