# Focus Mastery — Admin Panel Roadmap

Dev-only tooling so product flows can be tested without waiting 25 minutes per session or hand-grinding 300 minutes of history. Each phase is a vertical slice: shippable, testable, and builds on the previous phase.

**Design decisions (locked):**

| Decision | Choice |
|----------|--------|
| Hosting | Dev-only, local (`npm run dev`) — never ships in production |
| Surface area | Inline dev toolbar on main app **and** `/admin` page (toolbar first) |
| Timer shortcuts | Instant complete + short-duration mode |
| Survey / break | Quick-submit Clean / Distracted + skip break |
| `/admin` scope | Reset, progress editor, session seeder, scenario presets |
| Gating | `import.meta.env.DEV` **and** `VITE_DEV_TOOLS=true` in `.env.local` |
| Data target | Same Google account, same Firestore project (real data) |
| Preset behavior | Reset-then-seed (predictable state every time) |
| Toolbar UX | `` ` `` keyboard toggle → floating panel (bottom-right) |
| Confirmations | Single-click modal with action summary (session count, fields changed) |
| Short duration | Configurable in toolbar; default **10 seconds** |
| Scenario presets (v1) | Cold start, Almost advancing, Below threshold, Step-back ready, Calendar month |

---

## Phase 1 — Dev gate + routing shell
Status: [x] Done

**Goal:** Dev tools are opt-in, stripped from production builds, and `/admin` is reachable in dev without touching product UI yet.

**Deliverables:**
- `VITE_DEV_TOOLS` env flag documented in `.env.example`; dev tools inactive unless `import.meta.env.DEV && import.meta.env.VITE_DEV_TOOLS === 'true'`
- `src/dev/isDevToolsEnabled.ts` — single gate used by all dev code
- Lightweight routing in `App.tsx` (pathname check or minimal router): `/admin` renders admin shell; all other paths unchanged
- Admin route + all `src/dev/**` imports wrapped so Vite tree-shakes them from `npm run build` output
- `/admin` placeholder page: "Dev tools" heading, signed-in UID display, link back to main app
- Main app unchanged when `VITE_DEV_TOOLS` is unset or false

**Dependencies:** Existing auth + Firebase client.

---

## Phase 2 — Inline dev toolbar
Status: [x] Done

**Goal:** Toggle a floating dev panel on the main three-column layout and shortcut the timer → survey → break loop without leaving the real UI.

**Deliverables:**
- `` ` `` keyboard listener (dev-only) toggles floating panel; panel hidden by default
- Floating panel (bottom-right): collapsible, unobtrusive, does not affect three-column layout
- **Complete now** — ends active focus session via real completion path (`handleFocusComplete` → Firestore write → survey)
- **Short duration mode** — toggle + seconds input (default 10); overrides focus duration for next session start only; reads real `currentStageMinutes` when off
- **Clean** / **Distracted** — visible while survey is open; submits real survey answers through existing `updateSessionSurvey` + `runMasteryEngineAfterSession`
- **Skip break** — visible while break timer runs; returns to idle without waiting
- Toolbar actions that mutate nothing (complete, skip break, survey submit) require no confirm dialog
- Timer exposes dev hooks via ref/callback/context — no duplicate Firestore write paths

**Dependencies:** Phase 1 complete.

---

## Phase 3 — `/admin` reset + progress editor
Status: [x] Done

**Goal:** Full account wipe and manual progress editing from `/admin`, with clear summaries before destructive actions.

**Deliverables:**
- **Reset account** button: deletes all `users/{uid}/sessions/*`, resets `users/{uid}/progress` to defaults (`currentStageMinutes: 25`, nulls on optional fields)
- Single-click confirm modal shows: session count to delete, progress fields to reset
- After reset, Zustand store refreshes (re-fetch sessions + progress or trigger existing sync hook)
- **Progress editor** form for `currentStageMinutes`, `prevMasteryPercent`, `lastProgressionAt`, `stepBackOfferedAt` — save writes to Firestore via existing `saveUserProgress`
- Read-only summary: current rolling window stats (total min, clean rate, is full) computed from live session data
- Link from `/admin` to main app; dev toolbar still available on main app

**Dependencies:** Phase 1 complete. Can ship in parallel with Phase 2 but listed after Phase 2 in build order.

---

## Phase 4 — Session seeder + scenario presets
Status: [ ] Not started

**Goal:** One-click predictable test states. Every preset resets first, then seeds — no partial/ambiguous window math.

**Deliverables:**
- `src/dev/seedSessions.ts` — creates completed session documents with correct fields (`durationMinutes`, `completedAt`, `q1Distracted`, `q2UsedPhone`, `distracted`, `startedAt`)
- Generic seeder controls: session count, duration, clean/distracted ratio, spread across N days (for manual experiments)
- Preset buttons (each runs reset-then-seed with single-click confirm showing exact plan):

| Preset | After reset, seeds… |
|--------|---------------------|
| **Cold start** | Nothing — default progress only |
| **Almost advancing** | 12 × 25 min clean (full 300 min window, 100% clean); next session should advance to 30 min |
| **Below threshold** | Full 300 min window at ~70% clean; tests projected date, no advancement |
| **Step-back ready** | Stage 35 min, `prevMasteryPercent: 0.55`, window ~45% clean; next distracted session triggers step-back offer |
| **Calendar month** | ~30 days of mixed clean/distracted sessions for belt colors and day tooltips |

- `completedAt` timestamps backdated realistically (spread across days for calendar preset)
- After seed, re-run mastery engine or refresh store so left panel + calendar reflect new state immediately

**Dependencies:** Phase 3 complete (reset logic reused by presets).

---

## Phase 5 — Polish + safety pass
Status: [ ] Not started

**Goal:** Dev tooling feels reliable during daily use on real data; edge cases handled.

**Deliverables:**
- Confirm modals always show live counts ("Delete **N** of your sessions…") — never hardcoded
- Disable dev actions while Firestore writes in flight; show loading on preset buttons
- Dev toolbar: indicate short-duration mode active (visual badge)
- Dev toolbar: disable "Complete now" when no active focus session; disable survey buttons when survey not visible
- `/admin` accessible only when signed in (redirect to sign-in or show message)
- README section: how to enable dev tools, toolbar shortcuts, preset descriptions, warning about real data
- Verify `npm run build` output contains no dev route strings or admin bundle (spot-check dist/)

**Dependencies:** Phases 1–4 complete.

---

## Dependency order

```
Phase 1 (Dev gate + routing)
    ├── Phase 2 (Inline dev toolbar)     ← build first for daily use
    └── Phase 3 (Reset + progress editor)
            └── Phase 4 (Seeder + presets)
                    └── Phase 5 (Polish)
```

Phase 2 and Phase 3 can be built in parallel after Phase 1; Phase 2 is prioritized because it unblocks timer/survey/break flow testing immediately.

---

## Out of scope (v1)

- Production-accessible admin (secret URL, deployed dev tools)
- Separate Firebase dev project / emulator
- Cross-user or multi-tenant admin
- Speed multiplier on running timer
- Additive-only presets (merge with existing sessions)
- Typed `RESET` confirm (single-click chosen; revisit if misclicks become a problem)
- Scenario presets: Partial window, Mid ladder (deferred — covered by inline toolbar + progress editor)
