# Focus Más — Project Brief

> **Note:** `specs.md` and `roadmap.md` are intentionally **not** created in this scaffold step. They will be produced by a grill-me session and follow-on build phases.

## Concept

A personal web app that trains attention span by gating progression on **focus performance**, not a fixed timetable. The user earns longer focus sessions only when recent performance proves they can sustain attention at the current level.

## Three components + progression engine

### 1. Pomodoro timer

Runs focus sessions and breaks at the user's current stage length (e.g. 25 min → 30 min → …).

### 2. Post-session survey

After each focus session, two yes/no questions:

- Did you get distracted?
- Did you use your phone or social media during the focus session?

Answers feed both the focus progression engine and the calendar.

### 3. Contribution calendar

GitHub-commit-style grid. Each day's color opacity reflects the percentage of that day's focus sessions completed **without distraction**. The projected progression date is surfaced here as motivation; a bad day pushes the date back.

### Focus progression engine

Over the last **X** hours of focus time, compute the percentage of sessions completed without distraction. When that exceeds threshold **Y%**, the user advances to the next focus-length stage. Because the rate is known, an estimated progression date can be calculated and shown on the calendar. Failing sessions push the date back.

## Tech stack (and why)

| Choice | Rationale |
|--------|-----------|
| **Vite + React + TypeScript** | Fast local dev, typed SPA, static deploy output |
| **Tailwind CSS v4** + liquid glass | Modern UI with translucent glass surfaces |
| **Zustand** | Lightweight client state without boilerplate |
| **Firebase Auth + Firestore** | Free **Spark** tier fits a single personal account; Google sign-in without a Workspace org |
| **vite-plugin-pwa** | Focus timer must survive wifi blips; sync on reconnect |
| **Static SPA** | Deploy-ready for Vercel Hobby or Cloudflare Pages (not deployed in this step) |

Env vars (`VITE_FIREBASE_*`) hold Firebase config — never hardcoded or committed.

## Open questions for the grill-me session

1. **Success definition:** Does progression count "sessions completed" or "sessions completed *without distraction*"? The calendar uses without-distraction — unify the two so the progress bar and calendar can't disagree.

2. **Estimate-date math is undefined when recent success rate < Y%** ("keep going at this rate" never crosses the line = "never"). What assumption do we bake in (e.g., assume all remaining sessions are clean = optimistic floor), and how is it labeled so the date doesn't look fabricated?

3. **Two different aggregations:** rolling X-hour window (progression) vs per-day opacity (calendar). Confirm both, and pin down actual values: X, Y, and the full stage ladder (25 → 30 → … → cap?).

4. **Edge cases:** cold start / first day with insufficient history; what (if anything) demotes a stage; do breaks count; what marks a session "completed" vs abandoned.

5. **Loss-framing:** the slipping date punishes a bad day — keep as-is or soften? (Decide deliberately.)
