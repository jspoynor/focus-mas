# Focus Más — Project Brief

> **Note:** `specs.md` is the authoritative product spec. `roadmap.md` tracks the daily-planner build phases (complete).

## Concept

A personal web app that trains attention span by gating progression on **focus performance**, not a fixed timetable. The user earns longer focus sessions by completing **5 consecutive clean sessions** at their current level.

## Three components + progression engine

### 1. Pomodoro timer

Runs focus sessions and breaks at the user's current stage length (25 min → 30 min → … → 90 min cap).

### 2. Post-session survey

After each focus session, two yes/no questions:

- Did you get distracted?
- Did you use your phone or social media during the focus session?

A **yes** on either question marks the session as distracted, which **resets the streak to 0**. Answers also feed the calendar's per-day shading.

### 3. Contribution calendar

GitHub-commit-style grid. Each day's cell uses belt color (longest session that day) and opacity (that day's uninterrupted rate). The right panel footer shows a **5-segment streak bar** (`3/5`) toward the next level.

### Focus progression engine

- **Rule:** 5 clean sessions in a row → advance one stage (+5 min).
- **Reset:** one distracted completed session → streak back to 0 (level unchanged).
- **Scope:** only sessions since the last level-up count toward the current streak.
- **Cap:** at 90 min, the bar shows `Max level` — no further advancement.
- **No demotion:** focus duration never goes down.

## Tech stack (and why)

| Choice | Rationale |
|--------|-----------|
| **Vite + React + TypeScript** | Fast local dev, typed SPA, static deploy output |
| **Tailwind CSS v4** + liquid glass | Modern UI with translucent glass surfaces |
| **Zustand** | Lightweight client state without boilerplate |
| **Firebase Auth + Firestore** | Free **Spark** tier fits a single personal account; Google sign-in without a Workspace org |
| **vite-plugin-pwa** | Focus timer must survive wifi blips; sync on reconnect |
| **Static SPA** | Deploy-ready for Firebase Hosting |

Env vars (`VITE_FIREBASE_*`) hold Firebase config — never hardcoded or committed.
