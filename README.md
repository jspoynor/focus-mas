# Focus Más

A single-user web app that trains attention span by gating progression on **focus performance**, not a fixed timetable.

## Stack

- **Vite + React + TypeScript** — fast dev, static SPA output
- **Tailwind CSS v4** + **liquidglass-tailwind** — Liquid Glass UI
- **Zustand** — client state
- **Firebase** (Auth + Firestore, Spark/free tier) — Google sign-in and session sync
- **vite-plugin-pwa** — installable, offline-capable focus timer

Build output is a static SPA deployed to **Firebase Hosting** from the `prod` branch.

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

## Focus progression

Advancement is streak-based: complete **5 focus sessions in a row** without distraction to level up (+5 min, cap 90 min). One distracted session resets the streak to 0; your focus duration never goes down.

The right panel shows your current **focus level**, the contribution calendar, and a **5-segment streak bar** (`3/5`) at the bottom. Calendar day cells still show historical performance (longest session hue + daily uninterrupted opacity).

## Project structure

```
src/
  components/       # Shared layout shell
  features/
    planner/        # Daily planner panel
    timer/          # Pomodoro timer
    survey/         # Post-session survey
    calendar/       # Contribution calendar
    mastery/        # Focus progression engine
  store/            # Zustand app store
  lib/              # Firebase client, planner helpers
  types/            # Firestore types
```

Product spec: `specs.md`. Build sequencing: `roadmap.md`.

## Deployment (Firebase Hosting)

Production deploys run automatically when you push to the **`prod`** branch (see `.github/workflows/firebase-hosting.yml`). The workflow runs tests, builds the SPA, deploys Hosting, and deploys Firestore rules.

### One-time setup

1. **Firebase Console** — enable Hosting and Google sign-in; add your hosting domains under Authentication → Authorized domains (`focus-mas.web.app`, `focus-mas.firebaseapp.com`).
2. **GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web config |
| `VITE_FIREBASE_APP_ID` | Firebase web config |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON key for a deploy service account (Hosting Admin + ability to deploy Firestore rules) |

3. **Create the `prod` branch** and push it:

```bash
git checkout -b prod
git push -u origin prod
```

Merge or cherry-pick release-ready commits into `prod` to deploy.

### Manual deploy

```bash
cp .env.example .env.local   # fill VITE_FIREBASE_* for production project
npm ci && npm run build
npm run firebase:deploy      # hosting + firestore rules
```

Deploy rules only: `npm run firebase:deploy:rules`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Run unit tests |
| `npm run preview` | Preview production build |
| `npm run firebase:deploy` | Deploy Hosting + Firestore rules |
| `npm run firebase:deploy:hosting` | Deploy Hosting only |
| `npm run firebase:deploy:rules` | Deploy Firestore rules only |
