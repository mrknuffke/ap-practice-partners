# Session notes (2026-11-06)

**Done:** Shipped Stats 2026-27 CED + new FRQ types, May 2027 exam dates (9c6be6c). Then merged cloud branch `claude/intelligent-mccarthy-13sufp` (76ba538): unit tests (`npm test`, in preflight) + 4 fixes (streaming context-tag flash, multi-line tags, safeParseJSON \frac / refusals, $ prices in sanitizer).
**Open:** `src/components/InteractiveDemo.tsx` keeps its own `cleanContent` context-stripper (not the shared `src/lib/tutor-tags.ts`); not buggy, could be unified.
**Next step:** none pending. Branch `claude/intelligent-mccarthy-13sufp` can be deleted on GitHub.
**Gotcha:** iCloud/Finder made "* 2.*" duplicates inside .next/, which broke tsc. Fix: rm -rf .next test-results.
**Uncommitted:** nothing.
