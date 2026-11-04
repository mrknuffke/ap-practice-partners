# Rendering Gotchas

Every entry here is a bug that actually shipped. Read this before changing how
tutor output, generated questions, or session screens render. When you fix a new
rendering bug, add an entry **and** a check that would have caught it, in the
same commit: `scripts/preflight/check-math-sanitizer.mjs` for math conversion,
`tests/unit/` (run by `npm test` and preflight) for tag parsing, model JSON and
other pure functions, `tests/smoke/app.smoke.ts` for anything a signed-out
visitor sees. Screens behind
sign-in are verified by David, so for those, write the exact thing to look at.

Format: **Symptom** / **Cause** / **Correct pattern** / **Guard**.

---

## Students see raw LaTeX (`\frac{dy}{dx}`, `T_m`, `K_eq`)

- **Symptom:** Generated questions and grading feedback showed LaTeX source, and
  underscore subscripts as plain text.
- **Cause:** One math policy for every route. Streamed tutor chat can render LaTeX
  through KaTeX; the JSON-mode generation and grading routes are displayed without
  a math renderer, so any LaTeX there leaks.
- **Correct pattern:** The policy is split by route. `/api/tutor` (streamed) uses
  real LaTeX, rendered by KaTeX. JSON-mode routes (`/api/frq/*`, `/api/mcq/*`,
  `/api/source/*`, `/api/oral/grade`, `/api/summary`, `/api/mentor-tip`) are
  **Unicode only** (T_m becomes Tₘ). `src/lib/math-sanitizer.ts` converts stray
  LaTeX as defence in depth; do not rely on it instead of the prompt rule. Details:
  `docs/BRIEF_MATH_FORMATTING_FIX.md`.
- **Guard:** preflight runs `check-math-sanitizer.mjs` on known leak cases; the
  smoke suite fails any signed-out page with raw LaTeX in its rendered text.

## FRQ question text drops onto its own line below the part letter

- **Symptom:** "(a)" on one line, the question on the next.
- **Cause:** ReactMarkdown wraps content in `<p>`, a block element, and the `p`
  override was missing in that spot.
- **Correct pattern:** Wherever markdown renders inline next to a label, pass the
  `p: span` component override, the pattern already used elsewhere in
  `src/app/tutor/[course]/page.tsx`.

## The FRQ stimulus column is crushed to ~136px

- **Symptom:** On a 1440px screen with panels open, the stimulus column was
  unreadably narrow.
- **Cause:** Split layouts used viewport breakpoints, which do not change when a
  sidebar or context panel collapses or expands.
- **Correct pattern:** Module splits (MCQ, FRQ, Source) use container queries
  (`@container`, `@3xl:`, `clamp()` widths), so collapsing a panel reflows the
  layout without a window resize.

## Raw `:::context{...}` JSON flashes or stays in a tutor reply

- **Symptom:** While a reply streamed, the raw context JSON appeared on screen
  once its first `"key":` arrived. If the model pretty-printed a tag across
  lines, the raw tag stayed in the finished message and the MCQ/FRQ trigger in
  it never fired.
- **Cause:** The hold-back test for an unfinished tag rejected any colon, and
  JSON is full of them. The end-of-reply strip and trigger regexes used `.`,
  which does not match a newline.
- **Correct pattern:** All tag parsing lives in `src/lib/tutor-tags.ts`
  (`buildSafeDisplay`, `cleanReply`, `findTrigger`, `extractTagJSON`,
  `messageSnippet`). Don't write tag regexes inline in the page.
- **Guard:** `tests/unit/tutor-tags.test.mjs`.

## Generated questions show "rac{1}{2}", or a module crashes on a refusal

- **Symptom:** Unescaped `\frac` or `\beta` in model JSON lost its first letter;
  a plain-text model reply was parsed into an array and the module crashed.
- **Cause:** `\f` and `\b` are legal JSON escapes (form feed, backspace);
  jsonrepair turns prose into JSON values instead of failing.
- **Correct pattern:** Parse model JSON only with `safeParseJSON`
  (`src/lib/safe-json.ts`): it keeps the backslash before `\f`/`\b` + letter and
  throws unless the result is an object or array, so callers hit their error path.
- **Guard:** `tests/unit/safe-json.test.mjs`.

## Session summaries drop dollar signs from prices

- **Symptom:** "Price rose from $5 to $10" became "Price rose from 5 to10".
- **Cause:** The sanitizer's `$...$` unwrapping treated any two dollar signs as
  math delimiters.
- **Correct pattern:** Unwrap only when the delimiters hug their content and the
  closing `$` is not followed by a digit (the Pandoc rule).
- **Guard:** `tests/unit/math-sanitizer.test.mjs`.
