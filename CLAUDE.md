@AGENTS.md

# AP Practice Partners: Claude Code notes

General working rules (scope, two-attempt rule, verification, deploy safety,
session notes) are in `~/.claude/CLAUDE.md`. Project context is in `PICKUP.md`.
This file holds the repo facts those rules depend on.

## Scope: name the surface first

This app has several places a "choice" can live, and building in the wrong one
has cost a full rework: pre-session pickers were first built as an in-chat
answer picker.

- **Session setup screen** (before the session starts): course, FRQ type, MCQ
  unit, MCQ format (independent vs. passage-based), and similar configuration.
- **In-session chat** (the tutor conversation and its answer widgets).
- **Dashboard / sidebar / settings.**

Before building, say which surface you understood, and **list every option or
picker you intend to add**. When changing session setup, enumerate all of its
pickers, including ones you are not changing, so a missing one (the MCQ format
picker was omitted the first time) is caught before code is written.

## Deploy Safety

- **Production:** https://ap-practice-partners.vercel.app (Vercel, deploys `main`
  on push). After a push, confirm `200` on `/` and `/tutor/ap-biology`, and `401`
  on a signed-out `GET /api/mcq/units`, before reporting done.
- **Runtime:** builds and serves on **Node 22** (`.nvmrc`; Next 16 needs ≥20.9).
  The Vercel project's Node setting is not recorded in the repo; if it is changed,
  update `.nvmrc` to match.
- **`npm run preflight`** (`scripts/preflight/preflight.sh`) is the push gate:
  typecheck → lint (errors) → math-sanitizer check → `next build` under Node 22 →
  `next start` → every page and course route serves (`check-routes.mjs`) → **every
  API route refuses a signed-out request with 401** (a route shipped without
  `requireAuth()` would expose Gemini quota to anyone) → browser smoke suite.
  Pages, API routes, and courses are discovered automatically.
- **Never push without a green preflight.** It runs in the git pre-push hook
  (`.githooks/`, installed by `npm install` via `prepare`) and in CI
  (`.github/workflows/preflight.yml`, no secrets needed). Never use `--no-verify`;
  a Claude Code hook refuses it.
- **Snapshot baseline** `tests/smoke/__snapshots__/`: after an intentional change
  to the sign-in card, `PREFLIGHT_PLAYWRIGHT_ARGS=--update-snapshots npm run preflight`,
  review, commit.
- **Changelog for `/ship`:** update `PICKUP.md` (*What's Working* / *Known Gaps*)
  when a feature ships or a gap closes.

## Verification

- **Every screen except the sign-in gate is behind Google sign-in** (the
  Gatekeeper wraps the whole app in `src/app/layout.tsx`). Automated checks cover
  only what a signed-out visitor gets: `tests/smoke/app.smoke.ts` visits every page
  and course route and requires a clean sign-in gate.
- **There is deliberately no test-auth fixture.** A committed way to get an
  Auth.js session without Google sign-in would be a bypass, and it is the exact
  detour (fake session tokens plus a Playwright harness) that once burned a
  session here. Two hooks enforce it: `pre-bash.sh` refuses commands that encode or
  plant a session, and `pre-write.sh` refuses writing such code outside `src/auth.ts`,
  `src/lib/auth-guard.ts`, `src/app/api/auth/`, and `Gatekeeper.tsx`.
- **For anything behind sign-in: stop and ask David to look**, with a short
  numbered checklist (URL, what to click, what correct looks like). `/verify-ui`
  produces that checklist.

## Rendering Gotchas

Read `docs/RENDERING_GOTCHAS.md` before changing how tutor output, generated
questions, or session screens render. Every entry shipped once; each new
rendering fix adds an entry and a check.

## Claude Code hooks

`.claude/settings.json`, scripts in `scripts/claude-hooks/`:
- after editing `.ts/.tsx/.js/.mjs`: ESLint `--fix` on that file (errors come back
  to fix now; max two attempts, then show David)
- async after `.ts/.tsx` edits: `tsc --noEmit`, waking Claude on errors
- before Bash and Write/Edit: the deploy-gate and forged-auth guards above
