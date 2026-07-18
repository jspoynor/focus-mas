---
name: verify
description: How to launch and drive Focus Más locally to verify changes end-to-end, including reaching the signed-in app shell without real Firebase auth.
---

# Verifying Focus Más locally

## Launch

- `npm run dev` — Vite picks the first free port from 5173 up. **Read the
  server output for the actual port**; other projects often occupy 5173+.

## Reaching the signed-in app shell without real auth

The app shell (planner, timer, calendar) is gated on Firebase auth. In the
Vite dev server you can fake the store state from the browser console —
Vite serves modules by URL, so you get the same instances the app uses:

```js
import('/src/store/useAppStore.ts').then(mod => {
  window.__store = mod.useAppStore
  mod.useAppStore.setState({ authStatus: 'signed-in', userId: null, userDataStatus: 'ready' })
})
```

- **Keep `userId: null`.** Every Firestore write path gates on a truthy
  `userId`, so null renders the UI with persistence fully disarmed. Never
  fake a real-looking userId (see CLAUDE.md).
- A data-loading effect reacts to the auth change and resets
  `userDataStatus` to `'idle'`, which makes the planner editors read-only
  (`contenteditable="false"`). After the shell mounts, set it again:
  `window.__store.setState({ userDataStatus: 'ready' })`.
- Any HMR that escalates to a full page reload wipes this state — re-apply.

## Driving the planner editors

- Two TipTap editors: aria-labels `Day plan` and `Focus session plan`,
  DOM `.planner-markdown-editor .tiptap`.
- Typing `[ ] ` at a line start creates a task checkbox (input rule).
  Input rules only fire on real typed input — `execCommand('insertText')`
  and bulk inserts do NOT trigger them.
- Assert focus with `document.activeElement === pm`, structure with
  `pm.innerHTML`.

## Gotchas when the Chrome window is occluded/hidden

- `document.visibilityState === 'hidden'` throttles `requestAnimationFrame`
  forever — anything deferred to rAF (e.g. TipTap's `commands.blur()`)
  never runs, and awaiting rAF in injected JS hangs the CDP call.
- CDP mouse clicks stop moving focus and CDP `type` can silently drop.
  Fall back to `element.focus()` plus synthetic
  `new KeyboardEvent('keydown', …)` dispatched on the editor DOM — the
  ProseMirror keymap handles those regardless (check `defaultPrevented`
  to see if a handler consumed the key). Best of all: bring the Chrome
  window to the foreground before driving.
