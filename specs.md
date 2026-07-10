# Focus Más — Authoritative Product & Technical Spec

## 1. Core concept

A single-user PWA that trains attention span by gating progression on focus performance, not a fixed timetable. Users complete Pomodoro-style focus sessions, answer a two-question post-session survey, and advance to longer focus durations after **5 consecutive clean sessions** at the current level.

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

One break type only — no long-break mechanic. Breaks are UI-only: no Firestore writes, no streak impact.

---

## 4. Post-session survey

Shown after every completed focus session (timer ran to zero). Two yes/no questions:

1. **Q1** — Did you get distracted?
2. **Q2** — Did you use your phone or social media during the focus session?

**Distraction signal:** `distracted = q1 OR q2` (boolean). Both raw answers and the computed boolean are stored.

Sessions where the timer did **not** run to zero are discarded entirely — not recorded, not counted as distracted.

---

## 5. Focus progression engine

### 5.1 Streak rule

Progress toward the next stage is a **streak of 5 clean sessions in a row**:

- Only **timer-to-zero** sessions with a completed survey count.
- A session is **clean** when `distracted = false` (no on either survey question).
- A **distracted** completed session resets the streak to **0**.
- Abandoned sessions (stopped before zero) are discarded — they do not help or hurt the streak.

The check runs after every completed session.

### 5.2 Streak scope

The streak counts only sessions completed **since `lastProgressionAt`** (the timestamp of the user's last stage advance). When the user levels up, the streak resets to 0 and they need 5 fresh clean sessions at the new duration.

On first use (`lastProgressionAt` is null), all completed sessions in history count.

The streak is **computed from session history** on read — not stored as a separate Firestore field.

### 5.3 Advancement

When `currentStreak ≥ 5` and `currentStageMinutes < 90`:

1. Advance `currentStageMinutes` by 5 (cap at 90).
2. Set `lastProgressionAt` to now (streak becomes 0 for the new level).

### 5.4 No demotion

Focus levels **only go up, never down**. A distracted session resets streak progress, not the stage duration. There is no step-back offer.

### 5.5 Streak bar (right panel)

A **segmented bar** at the bottom of the calendar panel shows progress:

- **5 segments**, filled left-to-right for each clean session in the current streak.
- **Label:** `3/5` (or `Max level` at the 90-minute cap).
- **Fill color:** current focus-level belt color.
- At max level: all segments filled, label `Max level`.

---

## 6. Calendar

### 6.1 Grid

GitHub contribution-style grid. Each cell = one calendar day.

- **Empty cell** (no completed sessions that day): no fill, grid placeholder only.
- **Filled cell**: two visual channels (see §6.2):
  - **Hue** — longest focus session that day (`max(durationMinutes)`), mapped to the stage-aligned belt ladder.
  - **Opacity** — that day's uninterrupted rate: `cleanSessions / completedSessions`.

### 6.2 Cell fill encoding

**Longest session → hue.** Use the 13-step summer belt palette aligned to focus-stage lengths (25–90 min, 5-min steps). Durations below 25 min clamp to step 1; above 90 min clamp to step 13. Same mapping as the stage label in the calendar header.

| Step | Stage (min) | Color |
|------|-------------|-------|
| 1 | 25 | Warm white / cream |
| 2 | 30 | Pale gold |
| 3 | 35 | Sunny yellow |
| 4 | 40 | Amber |
| 5 | 45 | Warm orange |
| 6 | 50 | Chartreuse |
| 7 | 55 | Fresh green |
| 8 | 60 | Teal |
| 9 | 65 | Sky blue |
| 10 | 70 | Indigo |
| 11 | 75 | Warm purple |
| 12 | 80 | Rich brown |
| 13 | 85–90 | Deep espresso / near-black |

**Uninterrupted rate → opacity.** Linear scale with a visible floor so distracted days still show the duration hue faintly:

```
uninterruptedRate = cleanSessions / completedSessions   // that day
cellOpacity       = 0.20 + 0.80 × uninterruptedRate
```

100% uninterrupted → full saturation. 0% uninterrupted → 20% opacity (faint tint).

### 6.3 Date markers

- **Today:** solid red circle around the cell (Notion-style). Hover tooltip: *"Today"*

### 6.4 Session history tooltip

Hovering a past day cell shows:
- A summary line: *"[N] session(s) · [X]% uninterrupted"* (e.g. *"3 sessions · 67% uninterrupted"*)
- A list of that day's survey-complete sessions, oldest first, each numbered to match planner snapshot order:
  - **Session [N]** (medium weight)
  - Session duration and interrupted status on the next line: *"[duration] min · interrupted: yes/no"* (`interrupted: yes` when either survey answer was yes)

### 6.5 Planner snapshot (calendar click)

Clicking a **today or past** calendar cell opens **snapshot mode** for that date. Future dates are not clickable for planner purposes.

- **Left panel** loads that date's archived planner data (read-only).
- **Day plan** shows saved text, or placeholder *"No day plan recorded"* if empty.
- **Focus session** arrows browse that day's focus snapshots only (no draft slot in snapshot mode). Placeholder *"No focus plans recorded"* if none exist. Header: `Focus session · N of M`.
- **App header** center replaces the live date with `Snapshot · [long date with ordinal]` and a **Return to today** button to the right of the date label.
- Hover tooltips for session stats continue to work alongside click-to-snapshot.

---

## 7. UI layout

### 7.1 Three-column layout (permanent)

```
┌─────────────────────────────────────────────────┐
│  [Left glass panel]  [Timer]  [Calendar panel]  │
└─────────────────────────────────────────────────┘
```

- **Left panel:** daily planner (see §7.2) — styled glass card, visually balanced with the right calendar panel.
- **Center:** Pomodoro timer — dominant, large.
- **Right panel:** contribution calendar with focus level header and streak bar (§5.5).

### 7.2 Left panel — daily planner

Two stacked text areas inside the left glass panel, split **5/8** (top) and **3/8** (bottom) of the panel height.

| Section | Header | Role |
|---------|--------|------|
| Top (5/8) | **Day plan** | Freeform notes for the whole day |
| Bottom (3/8) | **Focus session** | Plan for the upcoming (or in-progress) focus session; `‹` / `›` arrows flank the header |

#### 7.2.1 Live today mode (default)

- **Day plan** is editable all day, including during an active focus session, survey, or break.
- **Focus session** textarea:
  - Editable only while the timer is **idle** (ready state).
  - **Locked** (read-only) from **Start focus** until the timer returns to **idle** after survey + break (or skip break).
  - Clears when returning to idle so the user can plan the next session.
- **Focus arrows** paginate snapshots for today plus the live draft as the **last page**:
  - Pages `1 … N` = completed session snapshots (read-only while browsing).
  - Page `N + 1` = empty editable draft for the next session.
  - Header shows `Focus session · K of M` where `M = N + 1` in live mode.
- **Stop session** (abandoned before timer zero): remove the snapshot created at Start focus for that attempt and **restore** the plan text to the focus textarea.

#### 7.2.2 Day boundary (local midnight)

A day completes at **local midnight**. When the calendar date rolls over while the app is open:

- Day plan textarea clears immediately (yesterday is already persisted).
- Focus session resets to page 1 of 1 (empty draft).
- If the user is viewing a **snapshot** of another date, the left panel does not change until they tap **Return to today**.

#### 7.2.3 Snapshot mode (calendar lookback)

Entered by clicking a today or past calendar cell (§6.5). Both sections are read-only. Focus arrows browse only archived snapshots (no draft page). **Return to today** exits snapshot mode and restores live editing for the current date.

#### 7.2.4 Persistence timing

| Field | When it writes to Firestore |
|-------|----------------------------|
| Day plan | Debounced auto-save (~2 s after typing stops) |
| Focus session plan | Snapshot on **Start focus**, linked to the new `sessionId` |

Writes use the same offline persistence as sessions; queued while offline and sync on reconnect.

### 7.2 Visual style

- Apple-style liquid glass UI throughout (transparent glass cards, backdrop blur)
- Nature photo wallpaper (grass/trees) as background
- No modal overlays — all interactions animate in-page, pushing or shrinking sibling elements

### 7.3 Survey animation

When the timer hits zero, the survey slides up from the bottom of the center column. The timer shrinks upward to make room. Both coexist vertically in the center panel until the survey is submitted.

### 7.4 Session-complete alerts

When a focus session timer hits zero, a two-tone audio cue plays and **repeats every 4 seconds** until the user dismisses it (any pointer click in the app, or clicking the desktop notification) or **15 minutes** elapse. Repeating audio is always on; it does not depend on the notification bell.

**Header bell (left):** optional desktop notifications, persisted in `localStorage` per browser.

| Bell state | Repeating audio | Desktop notification |
|------------|-----------------|----------------------|
| Off (default) | Yes | No |
| On + permission granted | Yes | Yes — title *Focus session complete*, body includes duration |
| On + permission denied | Yes | No — bell shows blocked state |

Permission is requested only when the user turns the bell on. Break timer end does not trigger alerts.

### 7.5 App header — date and snapshot

- **Live mode:** center shows today's long date with ordinal (e.g. *June 17th, 2026*).
- **Snapshot mode:** center shows `Snapshot · [long date with ordinal]` and a **Return to today** control immediately to the right of the date label.

### 7.7 Marketing page (signed-out view)

Unauthenticated users see the marketing page (`src/marketing/`) at any path — a scrolling
portfolio showcase, not a conversion funnel. It scrolls inside `.marketing-shell`, its own
scroll container nested in the `#root` overflow lock.

Four sections, in order:

1. **Hero** — *"Your attention span is trainable."* plus a compressed autoplay demo loop
   (~12 s): the countdown runs, the real `PostSessionSurvey` slides up, a calendar cell
   fills, and the streak bar ticks 3/5 → 4/5. Pauses on a hidden tab; reduced-motion
   visitors get the settled final frame.
2. **Ladder** — the fourteen stages from `getStageLadder()`, cream 25 min → espresso 90 min.
3. **Calendar** — an illustrated year, captioned as such. Sessions are generated by running
   the real progression rules (`src/marketing/demo/demoYear.ts`), so belt colors and stages
   cannot contradict `mastery.ts`.
4. **Close** — **Sign in with Google**.

Marketing code never writes to Firestore and never fakes a `userId`. See
`.claude/skills/marketing-page/SKILL.md`.

The plain sign-in card (`SignInScreen`) survives only as the auth gate for the dev-only
`/admin` route.

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

#### `users/{userId}/progress/main` (single document)

| Field | Type | Notes |
|-------|------|-------|
| `currentStageMinutes` | number | Active focus duration |
| `lastProgressionAt` | timestamp \| null | Timestamp of last stage advance; streak counts sessions after this |

#### `users/{userId}/plannerDays/{dateKey}`

One document per local calendar day. `dateKey` = `YYYY-MM-DD` in the user's local timezone (same scheme as calendar `toDateKey`).

| Field | Type | Notes |
|-------|------|-------|
| `dayPlan` | string | Freeform day notes; empty string if none |
| `focusSessions` | array | Ordered snapshots taken at Start focus |
| `focusSessions[].sessionId` | string | Matches `users/{userId}/sessions/{sessionId}` created at Start focus |
| `focusSessions[].planText` | string | Focus plan text at session start |
| `focusSessions[].startedAt` | timestamp | When Start focus was pressed |
| `updatedAt` | timestamp | Last write (day-plan auto-save or focus snapshot) |

**Dev reset account** (`/admin`) deletes all `plannerDays` documents in addition to sessions and progress.

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

## 10. Progression math reference

```
STREAK_TARGET = 5

relevantSessions = survey-complete sessions with completedAt > lastProgressionAt
                   (all survey-complete sessions if lastProgressionAt is null)
                   ordered by completedAt DESC

currentStreak    = count consecutive clean sessions from newest backward
                   (stop at first distracted session or when count reaches 5)

advancementCheck = currentStreak >= 5 AND currentStageMinutes < 90

on advance:
  currentStageMinutes += 5 (cap 90)
  lastProgressionAt     = now

// Calendar cell fill (per day — historical, independent of streak):
longestMinutes     = max(durationMinutes) among that day's completed sessions
uninterruptedRate  = count(distracted=false) / count(sessions that day)
cellHue            = beltColor(stageAligned(longestMinutes))   // clamp 25–90 min ladder
cellOpacity        = 0.20 + 0.80 × uninterruptedRate
```
