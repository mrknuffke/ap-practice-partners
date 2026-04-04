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
| `src/constants/activeLearning.ts` | `AP_PREP_ACTIVE_LEARNING_RULES`, `INTERACTION_MODES_INTRO`, `PEDAGOGY_ADAPTATIONS` per subject |
| `src/app/api/tutor/route.ts` | API route — loads CED JSON, assembles 5-section system prompt, streams Gemini response |
| `src/app/page.tsx` | Landing page — subject-grouped course grid, Physics C modal, filter, nav |
| `src/app/tutor/[course]/page.tsx` | Chat interface — AI-generated opening greeting, streaming, slug→registry lookup |
| `src/app/about/page.tsx` | About page |
| `src/app/feedback/page.tsx` | Feedback form (opens mailto) |
| `src/app/tutorial/page.tsx` | How-to-use page with 6 mode explainers |
| `src/components/Gatekeeper.tsx` | Auth gate |
| `scripts/extractCeds.mjs` | CED extraction script — uploads PDFs to Gemini File API, extracts structured JSON |

---

## CED JSON Schema

Each file in `extracted-ceds/` follows this schema (enhanced pass adds `keyTopics`):

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

The API route assembles a 5-section system prompt (sections joined with `\n\n---\n\n`):

1. **Role + scope declaration** — course name, CED-only constraint
2. **CED block** — units with weightings + keyTopics, practices, exam format, anti-patterns
3. **`AP_PREP_ACTIVE_LEARNING_RULES`** — max 1 paragraph, mandatory question after every exchange, Bloom's progression, 6 modes, MCQ/FRQ style rules
4. **`PEDAGOGY_ADAPTATIONS[subjectArea]`** — subject-specific rules (science uses SP framing, history uses DBQ/LEQ/SAQ, CS uses Java only, language uses target language, etc.)
5. **`INTERACTION_MODES_INTRO` + `OFF_TOPIC_RULES`** — session opening instruction + scope enforcement

---

## What's Working

- ✅ Landing page with 21 course cards grouped by subject, filter, Physics C modal
- ✅ All 21 courses have CED JSON data (20 Gemini-extracted, 1 hand-curated)
- ✅ Active learning pedagogy enforced via system prompt (1-para limit, mandatory Q, Bloom's, 6 modes)
- ✅ Subject-specific pedagogy adaptations (science/math/history/language/CS/economics)
- ✅ AI-generated opening greeting (bot offers 6 modes at session start)
- ✅ Physics C combined card with Mechanics/E&M selector
- ✅ Proper slug→display name resolution via registry
- ✅ About, Feedback, Tutorial pages
- ✅ App named "SAS AP Practice Partners" throughout
- ✅ TypeScript clean

---

## Known Gaps / Next Steps

### High Priority
- ✅ **No `keyTopics` in hand-curated African American Studies JSON** — completed
- ✅ **Feedback form uses `mailto:`** — mapped to GitHub issues

### Medium Priority
- ✅ **Calculus AB vs BC sub-selection** — modal added
- ✅ **Session summary** — Finish & Summarize feature ported

### Lower Priority
- **Phase 2 features** (from original brief): AP Quiz mode (unit/topic-scoped MCQ with UI), AP FRQ Simulator, AP CER/Data Analysis mode
- **Study history persistence** — localStorage-based session history
- **Unit count on course cards** — currently not shown (requires loading CED JSON server-side or bundling unit counts into the registry)

---

## Re-Extraction Script Notes

`scripts/extractCeds.mjs` — run from `ap-tutors-app/` directory:

```bash
node scripts/extractCeds.mjs
```

- Set `FORCE_REEXTRACT = false` for normal runs (skip already-extracted files)
- Set `FORCE_REEXTRACT = true` only to overwrite all files (e.g., after schema changes)
- `MANUAL_CURATED = ['ap-african-american-studies']` — always skipped regardless of flag
- `SKIP_SUBSTRINGS` — skips clarification PDFs and excluded courses (Research, Seminar, Art & Design)
- 15s delay between files; 3x retry with backoff for rate limits
- Uses Gemini 2.5 Pro (not Flash) for document reasoning
- PDFs live at `../../SAS AP CEDs/` relative to the script

---

## Environment Variables (`.env.local`)

```
GEMINI_API_KEY=...
CLASSROOM_CODE=aprocks   # comma-separated for multiple valid codes
```
