---
name: next
description: >-
  Reads specs.md and roadmap.md in the project root and works on whatever the
  roadmap says is next — full cycle from planning through implementation to
  marking the phase done. Use when the user invokes /next or asks to work on
  the next roadmap phase.
disable-model-invocation: true
---

# /next

## Purpose

/next reads specs.md and roadmap.md in the project root and works on whatever the roadmap says is next. specs.md is the source of truth for *what* the product should do and how it should be architected. roadmap.md is the source of truth for *sequencing and status* — which phases exist, in what order, and which are done. Every invocation of /next runs the full cycle below, start to finish, in one go: it does not stop partway and wait for a "go ahead" unless something specific requires it (see Step 2).

## Step 0: Normalize status markers (first run / format drift only)

specs.md and roadmap.md may not exist yet, or may not have a consistent status-marker convention. On every run, check roadmap.md for a consistent phase-status format. If it's missing or inconsistent, normalize it to this format and rewrite the file:

```
## Phase N: <title>
Status: [ ] Not Started | [~] In Progress | [x] Done

- task or subgoal
- task or subgoal
```

Use `[ ]`, `[~]`, and `[x]` as the only valid status markers. If roadmap.md doesn't exist, stop and tell me it's missing — don't invent a roadmap from nothing. If specs.md doesn't exist, stop and tell me it's missing too.

## Step 1: Identify the next phase

Scan roadmap.md top to bottom for the first phase marked `[ ]` (Not Started). If a phase is marked `[~]` (In Progress), prioritize that one instead — resume it rather than skipping ahead, since incomplete work shouldn't be abandoned for the next item in line.

If no phase is `[ ]` or `[~]`, report that the roadmap is fully complete and stop.

## Step 2: Plan the phase

Read specs.md in full and re-read the relevant section(s) tied to this phase. Produce a concrete implementation plan: what files will be created or touched, what the architecture/approach is, and how it maps back to specific lines or sections in specs.md.

Then check for prerequisites — things I need to handle that Claude Code cannot do itself. Examples: missing API keys or credentials, an external service that needs to be provisioned, a design/product decision that specs.md doesn't resolve, or a dependency on a previous phase that isn't actually done despite being marked `[x]`.

- If there are clarifying questions needed to remove ambiguity in the plan, ask them now, in chat, before writing code.
- If there are genuine prerequisites I need to take care of (not just informational notes), list them explicitly and **halt** — do not proceed until I've responded. Don't ask me to confirm assumptions or rubber-stamp the plan in general; only halt for things that actually block implementation.
- If there are no blocking prerequisites, state the plan briefly and proceed directly into implementation. Do not wait for a "go ahead" in this case.

## Step 3: Implement

Mark the phase `[~]` in roadmap.md before starting. Implement according to the plan from Step 2, following whatever coding conventions and architecture are already established in the codebase and specs.md.

## Step 4: Self-check against specs.md

Once implementation is done, review the work against specs.md specifically — not general code quality, but alignment: does the implementation actually do what specs.md says it should, using the architecture/approach specs.md describes?

- If everything aligns: proceed to Step 5.
- If there's a mismatch caused by an implementation mistake: fix it and re-check.
- If there's a mismatch because specs.md itself was wrong — e.g. it specified an incompatible tech stack, a flawed architectural decision, or something that turned out to be technically infeasible — do not silently fix specs.md. Report the conflict, explain why specs.md's approach didn't work, and propose a specific correction. Stop and let me decide whether to amend specs.md. Do not proceed past this point on your own judgment.
- If there's a mismatch and it's unclear which side is wrong (spec or implementation): report it and stop. Let me decide.

## Step 5: Update roadmap.md

Once the self-check passes, mark the phase `[x]` Done in roadmap.md. Do not touch specs.md unless Step 4 surfaced a spec-level flaw and I explicitly approved a change.

## Output

At the end of a run, give me a short summary: which phase was worked on, what changed, and current roadmap status. Don't pad this with restating the whole plan again.
