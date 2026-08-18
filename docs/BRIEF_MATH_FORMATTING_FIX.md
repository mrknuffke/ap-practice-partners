# Technical Brief: Universal Math Formatting & Defense-in-Depth

## 1. Problem Statement & Root Cause
In AP Calculus sessions (and potentially other STEM courses), unrendered LaTeX code (such as `$0/0$`, `$(x-3)$`, `$f(x) = \frac{x^2-9}{x-3}$`, `$y$-value`) was appearing in student-facing text, particularly in Session Summaries and grading feedback.

### Root Causes
1. **Missing Prompt Directives in `/api/summary`**: The summary generator prompt had no rules against LaTeX or specifying math notation.
2. **Inconsistent Prompt Coverage**: Grading routes (`/api/frq/grade`, `/api/source/grade`, `/api/oral/grade`, `/api/mentor-tip`) lacked unified math constraints.
3. **No Frontend Math Renderer or Sanitizer**: `react-markdown` was rendered with only `remark-gfm` and `rehype-raw`, meaning any raw LaTeX string `$ ... $` was output as raw text.

---

## 2. Architecture: 3-Layer Defense-in-Depth

1. **Layer 1 (Source Prevention — Universal Prompts):**
   - Centralized `FORMATTING_RULES` in `src/lib/prompt-fragments.ts` strictly mandates clean Unicode notation (e.g. `(x² − 9)/(x − 3)`, `lim(x → 3) f(x) = 6`, `y = 6`, `0/0`) and prohibits dollar signs (`$`, `$$`) and LaTeX commands (`\frac`, `\lim`, `\sqrt`, etc.).
   - Injected into `/api/summary`, `/api/tutor`, `/api/frq/grade`, `/api/source/grade`, `/api/oral/grade`, `/api/mentor-tip`, and active learning pedagogy.

2. **Layer 2 (Safety Net — Sanitizer Utility):**
   - `sanitizeMathContent` in `src/lib/math-sanitizer.ts` strips stray dollar signs around plain variables and converts leaked LaTeX macros (`\frac{a}{b}` -> `(a)/(b)`, `\to` -> `→`, `\pm` -> `±`, `\cdot` -> `·`, `\le` -> `≤`, `\ge` -> `≥`, `\neq` -> `≠`, `\sqrt{x}` -> `√(x)`).

3. **Layer 3 (Frontend KaTeX Rendering):**
   - Configured `remark-math` and `rehype-katex` with `katex/dist/katex.min.css` across all `ReactMarkdown` instances in `src/app/tutor/[course]/page.tsx` and `src/components/InteractiveDemo.tsx`.
   - Added KaTeX CDN stylesheet and auto-renderer script to `handlePrintSummary` so that printed/saved PDFs render properly.

---

## 3. Key Files Changed

| File | Changes Made |
|---|---|
| `package.json` | Installed `remark-math`, `rehype-katex`, `katex`, `@types/katex`. |
| `src/app/layout.tsx` | Imported `katex/dist/katex.min.css`. |
| `src/lib/prompt-fragments.ts` | Expanded `FORMATTING_RULES` with comprehensive math typography and LaTeX bans. |
| `src/constants/activeLearning.ts` | Updated `AP_PREP_ACTIVE_LEARNING_RULES` and `PEDAGOGY_ADAPTATIONS.math` to align with Unicode standards. |
| `src/app/api/summary/route.ts` | Injected `FORMATTING_RULES` into the summary generator `systemInstruction`. |
| `src/app/api/frq/grade/route.ts` | Injected `FORMATTING_RULES` into FRQ grading prompt. |
| `src/app/api/source/grade/route.ts` | Injected `FORMATTING_RULES` into source/DBQ grading prompt. |
| `src/app/api/oral/grade/route.ts` | Added plain text / no LaTeX instruction to oral evaluation prompt. |
| `src/app/api/mentor-tip/route.ts` | Added no LaTeX / clean plain text rule to mentor tip prompt. |
| `src/lib/math-sanitizer.ts` | Created `sanitizeMathContent()` post-processing helper. |
| `src/app/tutor/[course]/page.tsx` | Added `remarkMath` and `rehypeKatex` to all `ReactMarkdown` components, applied `sanitizeMathContent` on summary completion, and added KaTeX to the print template. |
| `src/components/InteractiveDemo.tsx` | Added `remarkMath` and `rehypeKatex` to demo markdown renderer. |

---

## 4. Before & After Reference Table

| Context | Before (Faulty Output) | After (Clean Unicode Output) |
|---|---|---|
| **Indeterminate Form** | `yielding the $0/0$ indeterminate form` | `yielding the 0/0 indeterminate form` |
| **Factor / Expression** | `common factor of $(x-3)$` | `common factor of (x − 3)` |
| **Rational Function** | `$f(x) = \frac{x^2-9}{x-3}$` | `f(x) = (x² − 9)/(x − 3)` |
| **Squared Denominator** | `$g(x) = \frac{x-3}{(x-3)^2}$` | `g(x) = (x − 3)/(x − 3)²` |
| **Variable / Hole Value** | `exact $y$-value of the hole ($y = 6$)` | `exact y-value of the hole (y = 6)` |
| **Limits** | `$\lim_{x \to 3} f(x) = 6$` | `lim(x → 3) f(x) = 6` |
| **Chi-Square** | `$\chi^2 = \sum \frac{(O-E)^2}{E}$` | `χ² = ∑ (observed − expected)² / expected` |
