# SAS AP Practice Partners — Project Pickup Prompt

Use this to resume work in a new conversation.

---

## Project Summary

**SAS AP Practice Partners** is a Next.js (App Router) AI tutoring app for Singapore American School students preparing for AP exams. Each tutor is scoped to the official College Board CED for its course, enforces active-learning pedagogy, and uses Gemini 2.5 Flash for streaming responses.

**Live app directory:** `/Users/davidknuffke/Documents/Programming/APReviewBotProject/ap-tutors-app/`  
**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion, Google Gemini 2.5 Flash  
**Auth:** Class code gatekeeper (`localStorage` + server-side header check against `CLASSROOM_CODE` env var)  
**AI proxy:** `/src/app/api/tutor/route.ts` — streaming POST endpoint, no timeout issues

---

## Courses Supported (21 total)

All CED JSON files are in `src/constants/extracted-ceds/`. The course registry is in `src/constants/courses.ts`.

| Subject | Courses |
|---|---|
| Science | Biology, Chemistry, Environmental Science, Physics 1, Physics 2, Physics C (combined card) |
| Math | Calculus AB/BC, Statistics |
| History | US History |
| Gov/Politics | US Government & Politics, Comparative Government & Politics |
| English | English Language & Comp, English Literature & Comp |
| CS | Computer Science A |
| Economics | Macroeconomics, Microeconomics |
| Language | Spanish, French, Chinese Language & Culture |
| Other | African American Studies |

**AP Physics C** uses a combined course card — user selects Mechanics or E&M via a modal, then the URL param `?exam=mechanics` or `?exam=em` routes to the correct CED JSON pair.

**AP Calculus AB/BC** uses a single JSON (`ap-calculus-ab-and-bc.json`) covering both exams — the bot asks which sub-exam at session start.

**AP African American Studies** CED was hand-curated (PDF was incompatible with Gemini File API). File: `src/constants/extracted-ceds/ap-african-american-studies.json`.

---

## Key Files

| File | Purpose |
|---|---|
| `src/constants/courses.ts` | Course registry — all 21 courses, slugs, colors, subject areas, `COLOR_CLASSES` for Tailwind |
| `src/constants/activeLearning.ts` | `AP_PREP_ACTIVE_LEARNING_RULES`, `INTERACTION_MODES_INTRO`, `PEDAGOGY_ADAPTATIONS`, `CONTEXTUAL_METADATA_INSTRUCTION` |
| `src/app/api/tutor/route.ts` | API route — loads CED JSON, assembles 6-section system prompt, streams Gemini response |
| `src/app/api/mentor-tip/route.ts` | Generates a fresh AI-powered mentor tip each session (no cache) |
| `src/app/api/mcq/generate/route.ts` | Generates 5 AP-style MCQ questions for a given unit/topic |
| `src/app/api/mcq/grade/route.ts` | (unused — grading is client-side) |
| `src/app/api/frq/generate/route.ts` | Generates multi-part FRQ questions |
| `src/app/api/frq/grade/route.ts` | Grades FRQ responses per-part with rubric |
| `src/app/api/source/generate/route.ts` | Generates DBQ/source-based exercises |
| `src/app/api/source/grade/route.ts` | Grades source-based essay responses |
| `src/app/api/oral/route.ts` | Grades oral practice audio via Gemini |
| `src/app/api/summary/route.ts` | Generates end-of-session summary |
| `src/app/page.tsx` | Landing page — dashboard, mentor tip, study insights, pinned/starred courses, course grid |
| `src/app/tutor/[course]/page.tsx` | Chat interface — AI greeting, streaming, MCQ/FRQ/Source/Oral modules, live sidebar |
| `src/app/settings/page.tsx` | Settings — student name, teacher email, classroom code, appearance, danger zone |
| `src/lib/metrics.ts` | Computes dashboard metrics (sessions, recent wins, current focus) from localStorage |
| `src/components/Sidebar.tsx` | Left nav — real-time student name, navigation links |
| `src/components/Gatekeeper.tsx` | Auth gate |
| `scripts/extractCeds.mjs` | CED extraction script — uploads PDFs to Gemini File API, extracts structured JSON |

---

## CED JSON Schema

Each file in `extracted-ceds/` follows this schema:

```json
{
  "courseName": "AP Biology",
  "courseSlug": "ap-biology",
  "practicesLabel": "Science Practices",
  "practices": "Detailed paragraph on assessed skills and weightings...",
  "units": [
    {
      "unitNumber": "1",
      "unitTitle": "Chemistry of Life",
      "examWeight": "8-11%",
      "keyTopics": ["Specific CED topic 1", "Specific CED topic 2", "..."]
    }
  ],
  "examFormat": {
    "multipleChoice": "60 questions, 1 hr 30 mins, 50% of total score",
    "freeResponse": "6 questions, 1 hr 30 mins, 50% of total score"
  },
  "antiPatterns": "What's explicitly out of scope..."
}
```

---

## System Prompt Architecture

The API route assembles a **6-section** system prompt (sections joined with `\n\n---\n\n`):

1. **Role + scope declaration** — course name, CED-only constraint
2. **CED block** — units with weightings + keyTopics, practices, exam format, anti-patterns
3. **`AP_PREP_ACTIVE_LEARNING_RULES`** — max 1 paragraph, mandatory question after every exchange, Bloom's progression, 6 modes, MCQ/FRQ style rules, `:::mcq:::` / `:::frq:::` / `:::source:::` / `:::oral:::` trigger format
4. **`PEDAGOGY_ADAPTATIONS[subjectArea]`** — subject-specific rules (science uses SP framing, history uses DBQ/LEQ/SAQ, CS uses Java only, language uses target language, etc.)
5. **`INTERACTION_MODES_INTRO` + `OFF_TOPIC_RULES`** — session opening instruction + scope enforcement
6. **`CONTEXTUAL_METADATA_INSTRUCTION`** — instructs the AI to append a `:::context{...}:::` block after EVERY response with `mode`, `alignmentScore`, `alignmentNote`, `currentObjective`, `currentUnit` — powers the live right-side sidebar

---

## Sidebar Tag System

The AI uses `:::tag {json} :::` blocks at the end of responses to trigger interactive modes or send metadata:

| Tag | Purpose |
|---|---|
| `:::mcq {"unit":"1","format":"independent"}:::` | Launches MCQ trainer |
| `:::frq {"topic":"Cell Communication"}:::` | Launches FRQ simulator |
| `:::source {"topic":"Causation"}:::` | Launches Source/DBQ exercise (APUSH only) |
| `:::oral {"topic":"Unit 3 Vocab"}:::` | Launches Oral Practice |
| `:::context {"mode":"Socratic","alignmentScore":9,...}:::` | Updates live contextual sidebar (stripped from chat display) |

All tags are stripped from the displayed message content before rendering.

---

## localStorage Keys

| Key | Value |
|---|---|
| `classroom_code` | Student's classroom access code |
| `student_name` | Student's first name |
| `teacher_email` | Teacher email for pre-filling print/email reports |
| `starred_courses` | JSON array of starred course slugs |
| `ap_tutor_{slug}_{exam\|default}` | Full message history for a tutor session |
| `ap_metrics_cache` | Cached dashboard metrics |

---

## Dashboard Features

The landing page (`src/app/page.tsx`) includes:
- **Header**: Greeting + curriculum search bar (search is header-only)
- **Widgets row** (3-col):
  - Study Insights card — total sessions + current focus (most recently active course)
  - Recent Wins — completed MCQ/FRQ entries with scores
  - Mentor Tip — fresh AI-generated study tip per session via `/api/mentor-tip`
- **Pinned Courses** — starred courses shown at top with star icons
- **Course Grid** — all 21 courses grouped by subject, filterable by search

---

## Tutor Workspace Features

The tutor page (`src/app/tutor/[course]/page.tsx`) includes:
- **Header**: Back arrow, course badge, End & Summarize button, New Session button, Download/Email button (appears after summary)
- **Chat pane**: Streaming AI responses with markdown rendering, voice input, image attachment
- **Module system**: MCQ Trainer, FRQ Simulator, Source/DBQ Simulator, Oral Practice — all triggered by AI tags
- **MCQ results**: Per-question ✓/✗ breakdown with correct answer + explanation revealed for wrong answers
- **Right sidebar (live)**: Shows Current Mode, CED Alignment score bar + note, Current Unit, CED Objective — populated after every AI response via `:::context:::` parsing
- **Print/Download report**: Opens A4 landscape window with Download PDF + Email Teacher buttons, completed modules table, AI-generated session summary

---

## Design System

### Theme: "Cognitive Atelier" (light) + "Neon Lab" (dark)

**Light mode**
- Primary: deep emerald `oklch(0.42 0.13 163)` ≈ `#006c49`
- Background: off-white, pure white cards on subtle gray
- "No border" philosophy — tonal shifts define containers, not lines

**Dark mode**
- Primary: electric purple `oklch(0.76 0.17 302)` ≈ `#cc97ff`
- Secondary: cyan `oklch(0.83 0.13 213)` ≈ `#53ddfc`
- Background: near-black zinc `oklch(0.11 0.004 286)` ≈ `#0e0e10`
- Accent: lime `oklch(0.95 0.10 128)` ≈ `#e7ffc4`

**Typography**
- Heading font: **Plus Jakarta Sans** (`--font-plus-jakarta`)
- Body font: **Inter** (`--font-inter`)

**Token file:** `src/app/globals.css`

---

## What's Working

- ✅ 21 courses, each with CED JSON, scoped tutor, and correct pedagogy
- ✅ Active-learning protocol enforced system-wide
- ✅ 6 interaction modes (Explain, Practice, Review, Visualize, Quick Review, Explanation Partner)
- ✅ Phase 2 interactive modules: MCQ Trainer, FRQ Simulator, Source/DBQ Simulator, Oral Practice
- ✅ MCQ per-question breakdown in results (✓/✗, correct answer + explanation for misses)
- ✅ Live contextual sidebar: pedagogical mode, CED alignment score, current unit, CED objective
- ✅ Dashboard with Study Insights, Recent Wins, AI Mentor Tip (fresh per session)
- ✅ Starred/pinned courses on landing page
- ✅ Student name real-time sync across sidebar + settings
- ✅ Session summary (End & Summarize)
- ✅ Print/Download report: A4 landscape, Download PDF + Email Teacher, completed modules table
- ✅ Settings: name, teacher email, appearance, classroom access, danger zone
- ✅ Logout button in Settings
- ✅ Physics C combined card with Mechanics/E&M selector
- ✅ Calculus AB/BC sub-selection
- ✅ Voice input (Web Speech API) on chat + FRQ textarea
- ✅ Image attachment support on FRQ submissions
- ✅ Theme toggle (light/dark)
- ✅ Tutorial, About, Feedback, Progress, Educator Guide pages

---

## Known Gaps / Active Development

- **FRQ per-part score chips** — FRQ grader returns rubric data but the results UI could add individual part score chips (grader does per-part scoring, just not displayed separately yet)
- **Context sidebar resets on New Session** — `contextData` state is not cleared when starting a new session; minor cosmetic issue
- **Oral Practice** — MVP-level; could add audio playback, waveform visualization, more detailed per-criterion rubric display
- **Teacher dashboard** — no aggregate view across students (would require backend/database — out of current scope)
- **Deployment** — app is local/GitHub only; not yet deployed to Vercel for public access

---

## Workflow Notes

- **Do not push to git without explicit user approval.** Commit freely, but hold the push.
- Build verification: `npm run build` from `ap-tutors-app/` — must exit 0 before committing
- IDE shows JSX lint errors in `.tsx` files — these are false positives from the standalone TS server and do NOT affect the build
- Dev server: `npm run dev` from `ap-tutors-app/`

---

## Re-Extraction Script Notes

`scripts/extractCeds.mjs` — run from `ap-tutors-app/` directory:

```bash
node scripts/extractCeds.mjs
```

- Set `FORCE_REEXTRACT = false` for normal runs (skip already-extracted files)
- Set `FORCE_REEXTRACT = true` only to overwrite all files (e.g., after schema changes)
- `MANUAL_CURATED = ['ap-african-american-studies']` — always skipped regardless of flag
- 15s delay between files; 3x retry with backoff for rate limits
- Uses Gemini 2.5 Pro (not Flash) for document reasoning
- PDFs live at `../../SAS AP CEDs/` relative to the script

---

## Environment Variables (`.env.local`)

```
GEMINI_API_KEY=...
CLASSROOM_CODE=aprocks   # comma-separated for multiple valid codes
```
