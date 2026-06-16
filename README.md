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

## Project structure

```
src/
  components/       # Shared layout shell
  features/
    timer/          # Pomodoro timer (stub)
    survey/         # Post-session survey (stub)
    calendar/       # Contribution calendar (stub)
    mastery/        # Progression engine (stub)
  store/            # Zustand app store
  lib/              # Firebase client
  types/            # Provisional Firestore types
```

## Build-out

Feature logic, `specs.md`, and `roadmap.md` are **not** part of this scaffold. They are produced in a later **grill-me** session in Claude Code and subsequent build phases. See `PROJECT_BRIEF.md` for concept and open design questions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
