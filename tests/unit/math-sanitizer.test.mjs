import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMathContent } from '../../src/lib/math-sanitizer.ts';

test('converts fractions, roots, limits and arrows to Unicode', () => {
	assert.equal(sanitizeMathContent('\\frac{dy}{dx}'), '(dy)/(dx)');
	assert.equal(sanitizeMathContent('\\sqrt{16}'), '√(16)');
	assert.equal(sanitizeMathContent('\\lim_{x \\to 0}'), 'lim(x → 0)');
	assert.equal(sanitizeMathContent('A \\rightarrow B'), 'A → B');
});

test('converts common symbols and Greek letters', () => {
	assert.equal(sanitizeMathContent('\\Delta G \\leq 0, \\mu \\pm \\sigma, \\chi^2'), 'Δ G ≤ 0, μ ± σ, χ^2');
});

test('unwraps simple $...$ math', () => {
	assert.equal(sanitizeMathContent('when $x = 3$ and $y$'), 'when x = 3 and y');
});

test('leaves prices alone (economics summaries)', () => {
	assert.equal(sanitizeMathContent('Price rose from $5 to $10.'), 'Price rose from $5 to $10.');
	assert.equal(sanitizeMathContent('A range of $5-$10 per unit'), 'A range of $5-$10 per unit');
	assert.equal(sanitizeMathContent('Costs $4 and $6 each'), 'Costs $4 and $6 each');
});

test('leaves plain text and Unicode math unchanged', () => {
	const s = 'Kₑq = [C]/[A], ΔG < 0, the ratio is 3:1';
	assert.equal(sanitizeMathContent(s), s);
});

test('returns an empty string for empty or non-string input', () => {
	assert.equal(sanitizeMathContent(''), '');
	assert.equal(sanitizeMathContent(undefined), '');
});
