# Focus Mastery

A single-user web app that trains attention span by gating progression on **mastery**, not a fixed timetable.

## Stack

- **Vite + React + TypeScript** — fast dev, static SPA output
- **Tailwind CSS v4** + **liquidglass-tailwind** — Liquid Glass UI
- **Zustand** — client state
- **Firebase** (Auth + Firestore, Spark/free tier) — Google sign-in and session sync
- **vite-plugin-pwa** — installable, offline-capable focus timer

Build output is a static SPA, deploy-ready for Vercel Hobby or Cloudflare Pages.

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill VITE_FIREBASE_* values from your Firebase console (Spark plan).
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## Environment

Copy `.env.example` to `.env.local` (gitignored). Required keys:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

## Daily planner

The left panel is a two-section daily planner synced to Firestore (`users/{uid}/plannerDays/{YYYY-MM-DD}`):

- **Day plan** — freeform notes for the day. Auto-saves ~2 seconds after you stop typing (live today only).
- **Focus session** — plan for the next focus block. Snapshotted to Firestore when you press **Start focus**; cleared after survey + break when the timer returns to idle.

**Focus arrows** browse today's saved focus snapshots (read-only) plus an editable draft on the last page. **Stop session** removes the in-flight snapshot and restores your draft text.

Click a **today or past** calendar cell to open **snapshot mode** (read-only replay). The header shows `Snapshot · [date]` with **Return to today** to resume live editing.

At local midnight the day plan rolls over to a fresh today doc. If you're viewing a snapshot when midnight passes, the left panel stays on that date until you return to today.

Planner writes use the same Firestore offline cache as sessions — queued while offline and synced on reconnect.

## Project structure

```
src/
  components/       # Shared layout shell
  features/
    planner/        # Daily planner panel
    timer/          # Pomodoro timer
    survey/         # Post-session survey
    calendar/       # Contribution calendar
    mastery/        # Progression engine
  store/            # Zustand app store
  lib/              # Firebase client, planner helpers
  types/            # Firestore types
```

Product spec: `specs.md`. Build sequencing: `roadmap.md`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Run unit tests |
| `npm run preview` | Preview production build |
