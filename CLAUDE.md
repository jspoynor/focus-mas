# Focus Más

A web app that trains attention span by gating progression on focus performance. Complete
5 consecutive clean focus sessions to earn +5 minutes of stage length (25 min → 90 min cap).
One distracted session resets the streak; stage length never decreases.

`specs.md` is the authoritative product spec. `roadmap.md` tracks build phases.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Typecheck + production build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |

Run `npm test` and `npm run build` before considering a change done.

## Architecture

Vite + React 19 + TypeScript, Tailwind v4 with the `liquidglass-tailwind` plugin, Zustand for
client state, Firebase Auth + Firestore (Spark tier), `vite-plugin-pwa`. Static SPA deployed
to Firebase Hosting from the `prod` branch.

There is **no router**. `usePathname` reads `window.location.pathname`. `src/App.tsx` branches
on `authStatus`: `unknown` → loading, `signed-out` → marketing page, otherwise the app shell.

Progression math lives in `src/lib/mastery.ts` (`STREAK_TARGET`, `MIN_STAGE_MINUTES`,
`MAX_STAGE_MINUTES`, `STAGE_INCREMENT`). Belt colors and the stage ladder live in
`src/lib/beltColors.ts` (`getStageLadder()`). **Derive from these — never hardcode a stage
number or a belt color anywhere in the codebase.**

## The marketing page

`src/marketing/` is the public landing page shown to signed-out visitors at any path. It is a
portfolio showcase, not a conversion funnel.

**Before editing anything under `src/marketing/`, or the signed-out branch of `src/App.tsx`,
use the `marketing-page` skill.** It carries the section spine, the demo-loop rules, the voice,
and the constraints below. For visual work also use `liquid-glass-css-skill` and
`liquidglass-tailwind`.

Non-negotiables, repeated here because they are easy to violate accidentally:

- **Marketing code must never write to Firestore.** No imports from `lib/sessions`,
  `lib/plannerDays`, or `lib/firebase`. The only permitted side effect is `signInWithGoogle()`.
- **Never fake a `userId` to make a component "work" on the marketing page.** `Timer.tsx` gates
  its persistence on `userId`; a fake one arms real database writes.
- Reuse pure presentational components (`TimerDisplay`, `PostSessionSurvey`, `CalendarDayCell`).
  Do not add marketing-only props to `Timer`, `ContributionCalendar`, `MasteryStage`, or
  `StreakBar`.
- Do not relax the `html` / `body` / `#root` overflow lock in `src/index.css` to make the page
  scroll. `.marketing-shell` is its own nested scroll container.

## Conventions

- Glass surfaces use the shared classes in `src/index.css`: `.glass-panel`, `.glass-card`,
  `.glass-btn`, `.glass-btn-oval`, `.glass-surface`. Prefer these over new backdrop-filter CSS.
- Animations respect `prefers-reduced-motion` and `prefers-reduced-transparency`; both already
  have established blocks in `src/index.css`.
- Comments explain constraints the code cannot show. Do not narrate what the next line does.
