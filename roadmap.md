# Focus Mastery — Build Roadmap

Each phase is a vertical slice: shippable, testable, and builds directly on the previous phase. No phase introduces speculative abstractions.

---

## Phase 1 — Auth + shell
Status: [x] Done

**Goal:** A signed-in user sees the three-column glass layout with placeholder panels. Nothing functional yet, but the skeleton is permanent.

**Deliverables:**
- Firebase Auth wired up (Google sign-in)
- Sign-in screen: app name, description copy, "Sign in with Google" button
- Three-column layout locked in: left glass panel, center column, right glass panel
- Nature photo wallpaper background
- Liquid glass styling applied to all three panels
- Zustand auth state (`authStatus`, `userId`, `displayName`) connected to Firebase Auth listener
- Route guard: unauthenticated → sign-in screen, authenticated → main layout

**Dependencies:** Firebase project configured, `.env.local` populated.

---

## Phase 2 — Timer
Status: [x] Done

**Goal:** A working Pomodoro timer that runs focus sessions and break countdowns at the user's current stage, plays an audio cue on completion, and persists completed sessions to Firestore.

**Deliverables:**
- Timer UI in center column: large countdown display, start/stop controls
- Focus session runs at `progress.currentStageMinutes` (default 25 min on first load)
- Break timer runs automatically after a completed session: `round(focusDuration × 0.2)` to nearest 5 min
- Early stop discards session — no Firestore write
- Timer-to-zero triggers audio cue (browser Audio API)
- Completed session written to `users/{userId}/sessions/{sessionId}` with all fields except survey answers (written as `null` until survey completes — survey write is in Phase 3)
- `activeSessionId` in Zustand set on start, cleared on stop/complete
- PWA offline: timer runs client-side, Firestore write queues if offline, syncs on reconnect
- "Syncing..." indicator shown if reconnecting after >24 hours offline

**Dependencies:** Phase 1 complete, Firestore rules allowing user-scoped writes.

---

## Phase 3 — Post-session survey
Status: [x] Done

**Goal:** After every completed focus session, the survey animates into the center column and captures distraction answers. Session document is updated in Firestore. Mastery engine runs.

**Deliverables:**
- Survey slides up from bottom of center column when timer hits zero; timer shrinks upward to make room
- Two yes/no questions rendered as buttons
- On submit: `q1Distracted`, `q2UsedPhone`, `distracted` written to the session document
- Survey cannot be skipped (no dismiss button — must answer to proceed)
- After submit: survey animates away, break timer starts
- Mastery engine runs after each survey submission (see Phase 4 — engine can be a stub that logs output for now)

**Dependencies:** Phase 2 complete (session document exists before survey writes to it).

---

## Phase 4 — Mastery engine + progress document
Status: [x] Done

**Goal:** After each survey submission, the mastery engine computes the rolling window, checks for advancement, updates the progress document, and fires the step-back offer when appropriate.

**Deliverables:**
- `users/{userId}/progress` document created on first sign-in (default: `currentStageMinutes: 25`, all other fields null)
- Rolling window logic: fetch sessions ordered by `completedAt DESC`, accumulate `durationMinutes` until sum > 300, compute `cleanRate`
- Cold start: if accumulated time < 300 min, mastery shows "Building..." with a progress bar (% of 300 min filled)
- Advancement check: if `cleanRate >= 0.80` and window is full → increment `currentStageMinutes` by 5, update `lastProgressionAt`
- Step-back offer: if `newMasteryPercent < prevMasteryPercent AND newMasteryPercent < 0.50` → show in-page prompt offering to decrement stage; user accepts or declines; no forced change
- `prevMasteryPercent` updated on `progress` document after every session
- Timer reads `currentStageMinutes` from progress document on each new session start

**Dependencies:** Phase 3 complete (survey answers present on session documents).

---

## Phase 5 — Contribution calendar
Status: [x] Done

**Goal:** The right panel shows a GitHub-style contribution calendar with belt-color squares, today/projected-date markers, and per-day session history tooltips.

**Deliverables:**
- Calendar grid rendered in right panel: one cell per day, current month + trailing history
- Cell fill color: 13-step summer belt ladder based on `cleanSessions / completedSessions` for that day (empty cell if no sessions)
- Today marker: solid red circle (Notion-style), hover tooltip "Today"
- Projected advancement date marker: white circle, hover tooltip "If all upcoming sessions are clean, you could advance by [date]"
- Projected date math: assume future sessions all clean, calculate `cleanNeeded`, estimate from `avgSessionsPerDay`; label as conditional target
- Projected date label: *"If all upcoming sessions are clean, you could advance by [date]."* (shown below or above calendar)
- Session history tooltip on hover: list of that day's completed sessions with duration, Q1 answer, Q2 answer
- Calendar updates reactively after each survey submission

**Belt color hex values (summer palette):**

| Step | Band | Color name | Hex |
|------|------|------------|-----|
| 1 | 0–8% | Cream | `#FFF8E7` |
| 2 | 8–15% | Pale gold | `#FFE680` |
| 3 | 15–23% | Sunny yellow | `#FFD700` |
| 4 | 23–31% | Amber | `#FFA500` |
| 5 | 31–38% | Warm orange | `#FF6B35` |
| 6 | 38–46% | Chartreuse | `#A8D400` |
| 7 | 46–54% | Fresh green | `#4CAF50` |
| 8 | 54–62% | Teal | `#26A69A` |
| 9 | 62–69% | Sky blue | `#29B6F6` |
| 10 | 69–77% | Indigo | `#5C6BC0` |
| 11 | 77–85% | Warm purple | `#AB47BC` |
| 12 | 85–92% | Rich brown | `#8D5524` |
| 13 | 92–100% | Deep espresso | `#2C1503` |

**Dependencies:** Phase 4 complete (progress document and session data fully populated).

---

## Phase 6 — Polish + PWA hardening
Status: [x] Done

**Goal:** App is installable, feels complete, and handles all edge cases gracefully.

**Deliverables:**
- PWA manifest: app name, icons, display standalone
- Service worker via vite-plugin-pwa: cache shell + assets for offline load
- "Syncing..." indicator fully wired (offline gap > 24 hours)
- Audio cue asset finalized (clean tone, not jarring)
- Responsive layout: three-column on desktop, graceful stack on narrow viewports
- Firestore security rules: users can only read/write their own documents
- Loading states: skeleton screens while Firestore data loads on sign-in
- All hover tooltips (calendar markers, session history) accessible via keyboard/focus

**Dependencies:** Phases 1–5 complete.

---

## Dependency order

```
Phase 1 (Auth + shell)
    └── Phase 2 (Timer)
            └── Phase 3 (Survey)
                    └── Phase 4 (Mastery engine)
                            └── Phase 5 (Calendar)
                                    └── Phase 6 (Polish)
```

Each phase is strictly sequential — no parallelism needed at this scale.
