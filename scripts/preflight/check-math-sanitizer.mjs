/**
 * Pins the unrendered-LaTeX fix (commit 4e16751): JSON-mode routes return
 * Unicode-only math, and `sanitizeMathContent` is the defence-in-depth that
 * turns stray LaTeX into readable Unicode before a student sees it.
 *
 * The routes that exercise this sit behind sign-in and call the model, so the
 * browser suite cannot reach them. The sanitizer is a pure function, so it is
 * tested directly. Run under Node 22 with --experimental-strip-types by
 * preflight.sh; math-sanitizer.ts has no imports, so no bundler is needed.
 *
 * When a new LaTeX leak is fixed in the sanitizer, add its case here.
 */
import assert from 'node:assert/strict';
import { sanitizeMathContent } from '../../src/lib/math-sanitizer.ts';

const cases = [
	// [input, a substring that must be absent afterwards]
	['The slope is \\frac{dy}{dx} at x=2', '\\frac'],
	['Take \\sqrt{16} first', '\\sqrt'],
	['As \\lim_{x \\to 0} of f', '\\lim'],
	['Heat flows A \\rightarrow B', '\\rightarrow'],
];

let failed = 0;
for (const [input, forbidden] of cases) {
	const out = sanitizeMathContent(input);
	try {
		assert.ok(!out.includes(forbidden), `still contains ${forbidden}: ${out}`);
		assert.ok(out.trim().length > 0, 'sanitizer returned empty text');
	} catch (err) {
		failed++;
		console.log(`  ✗ ${JSON.stringify(input)} -> ${err.message}`);
	}
}
assert.equal(sanitizeMathContent(''), '');

if (failed) process.exit(1);
console.log(`  ✓ math sanitizer: ${cases.length} LaTeX leak cases converted`);
