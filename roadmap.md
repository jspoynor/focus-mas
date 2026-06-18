# Focus Mastery — Daily Planner Roadmap

Left-panel planner: day notes + per-session focus plans, persisted in Firestore and browsable via the calendar. Each phase is a vertical slice — shippable, testable, and builds on the previous phase.

**Design decisions (locked):**

| Decision | Choice |
|----------|--------|
| Layout | Left panel split **5/8** Day plan · **3/8** Focus session |
| Section headers | **Day plan** / **Focus session** |
| Day boundary | Completes at **local midnight**; immediate UI rollover when date changes |
| Day plan save | Debounced auto-save (~2 s after typing stops) |
| Focus plan save | Snapshot on **Start focus**, linked to `sessionId` |
| Focus clear | Clears when timer returns to **idle** (after survey + break) |
| Stop session | Remove snapshot for that attempt; **restore** draft text |
| During session | Day plan editable; focus section **locked** until idle |
| Focus arrows (live) | Draft is the **last page** (`1 … N` snapshots, `N+1` = next draft) |
| Calendar click | Today + past only → **snapshot mode** (read-only full replay) |
| Empty snapshot | Open with placeholders (*"No day plan recorded"*, *"No focus plans recorded"*) |
| Snapshot header | `Snapshot · [long date]` + **Return to today** in app header |
| Dev reset | Deletes sessions, progress, **and** all `plannerDays` |

Full product spec: `specs.md` §6.5, §7.2, §8.2.

---

## Phase 1 — Data layer + types
Status: [x] Done

**Goal:** Firestore schema and client helpers exist; no UI yet.

**Deliverables:**
- `PlannerDay` and `FocusPlanSnapshot` types in `src/types/`
- `src/lib/plannerDays.ts`:
  - `plannerDayRef(userId, dateKey)` — `users/{uid}/plannerDays/{YYYY-MM-DD}`
  - `loadPlannerDay(userId, dateKey)` — returns doc or defaults
  - `saveDayPlan(userId, dateKey, dayPlan)` — merge write with `updatedAt`
  - `appendFocusSnapshot(userId, dateKey, { sessionId, planText, startedAt })`
  - `removeFocusSnapshot(userId, dateKey, sessionId)` — for abandoned sessions
  - `deleteAllPlannerDays(userId)` — batch delete for dev reset
- `toDateKey` reused from `calendarGrid` for local date keys
- Unit-testable pure helpers for arrow page math (live vs snapshot mode)

**Dependencies:** Existing Firebase client + auth.

---

## Phase 2 — Planner panel shell
Status: [x] Done

**Goal:** Left panel shows the two-section layout with local state only (no Firestore yet).

**Deliverables:**
- `src/features/planner/PlannerPanel.tsx` — replaces empty `LeftPanel` content
- Vertical flex split: top `flex-[5]`, bottom `flex-[3]`, both `min-h-0`
- Section headers: **Day plan**, **Focus session** with `‹` / `›` arrow buttons flanking focus header
- Glass-styled `<textarea>` in each section; placeholder copy for empty fields
- Zustand slice or planner context: `dayPlanDraft`, `focusPlanDraft`, `focusPageIndex`
- Wire into existing `LeftPanel` glass card

**Dependencies:** Phase 1 types (optional for shell-only; required before Phase 3).

---

## Phase 3 — Day plan persistence
Status: [ ] Not Started

**Goal:** Day plan loads on sign-in and auto-saves to Firestore.

**Deliverables:**
- On user data load, fetch today's `plannerDays/{dateKey}` into store
- Debounced save (~2 s) on day plan edits in live today mode
- Skip writes in snapshot mode (read-only)
- Subtle save indicator optional (e.g. dim "Saved" / offline queue reuse from existing sync patterns)
- Midnight rollover listener: on local date change, clear day plan draft and load new empty today doc

**Dependencies:** Phase 1, Phase 2.

---

## Phase 4 — Focus plan + timer integration
Status: [ ] Not Started

**Goal:** Focus plan snapshots on Start focus and follows the session lifecycle.

**Deliverables:**
- Hook into `Timer` `handleStartFocus`: before timer starts, call `appendFocusSnapshot` with current focus draft + new `sessionId`
- Lock focus textarea when mode ≠ idle; day plan stays editable
- On return to idle (survey done + break ended/skipped): clear focus draft, reset to last arrow page (new empty draft)
- On **Stop session**: call `removeFocusSnapshot` for in-flight `sessionId`, restore text to focus textarea, unlock editing
- Timer exposes idle-transition callback or reuse existing mode subscription from dev toolbar pattern

**Dependencies:** Phase 1–3.

---

## Phase 5 — Focus session arrows
Status: [ ] Not Started

**Goal:** Browse today's focus snapshots; draft is always the last page.

**Deliverables:**
- Arrow buttons disabled at bounds
- Live mode paging: pages `1…N` = snapshots (read-only), page `N+1` = editable draft
- Header label: `Focus session · K of M` (`M = N + 1` in live mode)
- Textarea content switches between snapshot text and live draft based on page index
- After idle clear, auto-navigate to last page (draft)

**Dependencies:** Phase 4.

---

## Phase 6 — Calendar snapshot mode
Status: [ ] Not Started

**Goal:** Click today or past calendar cells to replay archived planner data.

**Deliverables:**
- `CalendarDayCell`: click handler for today + past dates (future cells unchanged)
- Planner store: `snapshotDateKey: string | null` — `null` = live today
- Snapshot mode: load `plannerDays/{dateKey}`, both sections read-only
- Placeholders when `dayPlan` or `focusSessions` empty
- Focus arrows: snapshots only (`M = N`, no draft page); disabled when `N = 0`
- `AppLayout` header:
  - Live: today's date (current behavior)
  - Snapshot: `Snapshot · [long date with ordinal]` + **Return to today** button
- **Return to today** clears `snapshotDateKey`, restores live drafts from Firestore

**Dependencies:** Phase 1–5.

---

## Phase 7 — Dev reset + polish
Status: [ ] Not Started

**Goal:** Planner data participates in account reset; edge cases handled.

**Deliverables:**
- Extend `resetUserAccount` to delete all `plannerDays` documents
- `/admin` confirm modal mentions planner day count
- Verify offline: day-plan debounce queues; focus snapshot queues on Start focus
- Disable planner edits while `userDataStatus === 'loading'`
- Verify midnight rollover while in snapshot mode (left panel unchanged until Return to today)
- README note: planner behavior summary

**Dependencies:** Phases 1–6.

---

## Dependency order

```
Phase 1 (Data layer)
    └── Phase 2 (Panel shell)
            └── Phase 3 (Day plan persistence)
                    └── Phase 4 (Focus + timer)
                            └── Phase 5 (Arrows)
                                    └── Phase 6 (Calendar snapshot)
                                            └── Phase 7 (Reset + polish)
```

---

## Out of scope (v1)

- Rich text / markdown in planner fields
- Future-date pre-planning (calendar click on future days)
- Planner search across days
- Separate Firebase collection per focus snapshot (embedded array chosen)
- Export / print planner notes
- Collaborative or shared planners
