# Focus Mastery — Authoritative Product & Technical Spec

## 1. Core concept

A single-user PWA that trains attention span by gating progression on mastery, not a fixed timetable. Users complete Pomodoro-style focus sessions, answer a two-question post-session survey, and advance to longer focus durations only when recent performance proves they can sustain attention at the current level.

---

## 2. Stage ladder

Focus duration increases in 5-minute increments from 25 to 90 minutes. There are **14 stages** and **13 progressions**.

| Stage | Duration |
|-------|----------|
| 1 | 25 min |
| 2 | 30 min |
| 3 | 35 min |
| 4 | 40 min |
| 5 | 45 min |
| 6 | 50 min |
| 7 | 55 min |
| 8 | 60 min |
| 9 | 65 min |
| 10 | 70 min |
| 11 | 75 min |
| 12 | 80 min |
| 13 | 85 min |
| 14 | 90 min (cap) |

---

## 3. Break duration

Break length scales with focus duration: `round(focusDurationMinutes × 0.2)` to the nearest 5 minutes.

| Focus | Break |
|-------|-------|
| 25 min | 5 min |
| 50 min | 10 min |
| 75 min | 15 min |
| 90 min | 20 min |

One break type only — no long-break mechanic. Breaks are UI-only: no Firestore writes, no mastery impact.

---

## 4. Post-session survey

Shown after every completed focus session (timer ran to zero). Two yes/no questions:

1. **Q1** — Did you get distracted?
2. **Q2** — Did you use your phone or social media during the focus session?

**Distraction signal:** `distracted = q1 OR q2` (boolean). Both raw answers and the computed boolean are stored.

Sessions where the timer did **not** run to zero are discarded entirely — not recorded, not counted as distracted.

---

## 5. Mastery progression engine

### 5.1 Rolling window

The engine looks back over the last **5 hours of accumulated completed focus time** (not wall-clock time). Only timer-to-zero sessions count toward the window.

### 5.2 Advancement threshold

When `cleanSessions / totalSessionsInWindow ≥ 80%`, the user advances to the next stage. The check runs after every completed session.

### 5.3 Cold start

Until 5 hours of completed sessions have accumulated, mastery displays as **"Building..."** with a progress bar toward the first full window. No advancement check and no projected date are shown during this period.

### 5.4 Step-back offer

Stages are permanent — a user never loses a stage. However, if performance drops significantly, the app offers to step the timer back:

- **Trigger:** after a completed session, if `newMasteryPercent < prevMasteryPercent AND newMasteryPercent < 50%`
- **Prompt:** *"Your recent sessions suggest this length might be a stretch. Want to step back to [stage - 5] min?"*
- **Cadence:** fires again only when a new session pushes the percentage lower while still below 50%. If the user is below 50% but trending upward, no prompt.
- The user's choice (accept or decline) is never forced.

### 5.5 Projected advancement date

Once the window is full:

- **If current rate ≥ 80%:** already advancing — no projected date needed.
- **If current rate < 80%:** assume all future sessions are clean, calculate how many clean sessions push the window above 80%, estimate date from the user's average sessions-per-day. Label: *"If all upcoming sessions are clean, you could advance by [date]."*
- The projected date updates silently after every session — no commentary, no "you lost X days."

---

## 6. Calendar

### 6.1 Grid

GitHub contribution-style grid. Each cell = one calendar day.

- **Empty cell** (no completed sessions that day): no fill, grid placeholder only.
- **Filled cell**: color encodes `cleanSessions / completedSessions` for that day using the 13-step belt color ladder (see §6.2).

### 6.2 Belt color ladder (summer palette)

13 discrete steps mapped to clean-rate bands (~8% each):

| Step | Band | Color |
|------|------|-------|
| 1 | 0–8% | Warm white / cream |
| 2 | 8–15% | Pale gold |
| 3 | 15–23% | Sunny yellow |
| 4 | 23–31% | Amber |
| 5 | 31–38% | Warm orange |
| 6 | 38–46% | Chartreuse |
| 7 | 46–54% | Fresh green |
| 8 | 54–62% | Teal |
| 9 | 62–69% | Sky blue |
| 10 | 69–77% | Indigo |
| 11 | 77–85% | Warm purple |
| 12 | 85–92% | Rich brown |
| 13 | 92–100% | Deep espresso / near-black |

### 6.3 Date markers

- **Today:** solid red circle around the cell (Notion-style). Hover tooltip: *"Today"*
- **Projected advancement date:** white circle around the cell. Hover tooltip: *"Projected advancement date — if all upcoming sessions are clean"*

### 6.4 Session history tooltip

Hovering a past day cell shows a list of that day's completed sessions, each with:
- Session duration
- Q1 answer (distracted: yes/no)
- Q2 answer (used phone: yes/no)

---

## 7. UI layout

### 7.1 Three-column layout (permanent)

```
┌─────────────────────────────────────────────────┐
│  [Left glass panel]  [Timer]  [Calendar panel]  │
└─────────────────────────────────────────────────┘
```

- **Left panel:** styled glass card, visually balanced with the right calendar panel. Contents TBD (reserved for future feature).
- **Center:** Pomodoro timer — dominant, large.
- **Right panel:** contribution calendar with mastery date markers.

### 7.2 Visual style

- Apple-style liquid glass UI throughout (transparent glass cards, backdrop blur)
- Nature photo wallpaper (grass/trees) as background
- No modal overlays — all interactions animate in-page, pushing or shrinking sibling elements

### 7.3 Survey animation

When the timer hits zero, the survey slides up from the bottom of the center column. The timer shrinks upward to make room. Both coexist vertically in the center panel until the survey is submitted.

### 7.4 Audio

An audio cue plays when the timer hits zero. No browser notifications.

### 7.5 Sign-in screen

Unauthenticated users see a single screen:
- App name: **Focus Mastery**
- Description: *"Focus Mastery trains your attention span one session at a time. Complete distraction-free sessions to prove you've mastered your current focus length — then grow into longer ones."*
- Button: **Sign in with Google**

---

## 8. Firebase data model

### 8.1 Auth

Firebase Auth, Google sign-in provider only.

### 8.2 Firestore collections

#### `users/{userId}/sessions/{sessionId}`

| Field | Type | Notes |
|-------|------|-------|
| `startedAt` | timestamp | When the timer started |
| `completedAt` | timestamp | When the timer hit zero |
| `durationMinutes` | number | Stage length at time of session |
| `stage` | number | Stage minutes (same as durationMinutes, explicit for queries) |
| `q1Distracted` | boolean | Raw answer to Q1 |
| `q2UsedPhone` | boolean | Raw answer to Q2 |
| `distracted` | boolean | Computed: `q1Distracted OR q2UsedPhone` |

#### `users/{userId}/progress` (single document)

| Field | Type | Notes |
|-------|------|-------|
| `currentStageMinutes` | number | Active focus duration |
| `lastProgressionAt` | timestamp \| null | Timestamp of last stage advance |
| `prevMasteryPercent` | number \| null | Mastery % after the previous session — used to detect declining rate |
| `stepBackOfferedAt` | timestamp \| null | Last time step-back prompt was shown |

### 8.3 Offline / PWA sync

- Firestore offline persistence via `enableIndexedDbPersistence`
- Timer runs entirely client-side — offline mode is automatic
- On reconnect, queued writes sync automatically
- If the app was offline for >24 hours when it reconnects, show a subtle *"Syncing..."* indicator

---

## 9. Tech stack

| Choice | Role |
|--------|------|
| Vite + React + TypeScript | SPA, static build output |
| Tailwind CSS v4 + liquidglass-tailwind | Liquid glass UI |
| Zustand | Client state |
| Firebase Auth + Firestore (Spark tier) | Auth and session persistence |
| vite-plugin-pwa | Installable PWA, offline timer |

Env vars (`VITE_FIREBASE_*`) — never hardcoded or committed.

---

## 10. Mastery math reference

```
windowSessions   = completed sessions whose cumulative durationMinutes ≤ 300 (5 hours),
                   ordered by completedAt DESC
cleanRate        = count(distracted=false in windowSessions) / count(windowSessions)
advancementCheck = windowSessions.count >= (300 / currentStageMinutes) AND cleanRate >= 0.80

// Projected date when cleanRate < 0.80:
cleanNeeded      = ceil(0.80 * windowSize) - currentCleanCount
daysToAdvance    = cleanNeeded / avgSessionsPerDay
projectedDate    = today + daysToAdvance

// Step-back trigger (evaluated after each session):
shouldOfferStepBack = newMasteryPercent < prevMasteryPercent AND newMasteryPercent < 0.50
```
