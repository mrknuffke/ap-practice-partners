import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeParseJSON } from '../../src/lib/safe-json.ts';

test('parses plain JSON', () => {
	assert.deepEqual(safeParseJSON('{"a":1}'), { a: 1 });
});

test('strips a ```json fence', () => {
	assert.deepEqual(safeParseJSON('```json\n{"totalPoints": 3}\n```'), { totalPoints: 3 });
});

test('cuts prose before and after the JSON', () => {
	assert.deepEqual(safeParseJSON('Here is the grade:\n{"score": 4}\nHope that helps!'), { score: 4 });
});

test('parses a top-level array', () => {
	assert.deepEqual(safeParseJSON('Questions: [{"q":1},{"q":2}]'), [{ q: 1 }, { q: 2 }]);
});

test('repairs a trailing comma and single quotes', () => {
	assert.deepEqual(safeParseJSON("{'a': 1, 'b': [1, 2,],}"), { a: 1, b: [1, 2] });
});

test('keeps unescaped LaTeX like \\frac and \\beta instead of reading form feeds', () => {
	// \f and \b are legal JSON escapes; without the guard "\frac" became a form feed + "rac".
	const out = safeParseJSON('{"stem": "Evaluate \\frac{1}{2}, \\beta and \\sqrt{4}"}');
	assert.equal(out.stem, 'Evaluate \\frac{1}{2}, \\beta and sqrt{4}');
});

test('leaves a correctly escaped backslash alone', () => {
	assert.equal(safeParseJSON('{"s": "a \\\\frac b"}').s, 'a \\frac b');
});

test('throws on a bare JSON string or number', () => {
	assert.throws(() => safeParseJSON('"just a string"'));
});

test('keeps nested objects whole', () => {
	const out = safeParseJSON('{"parts":[{"letter":"a","rubric":{"pts":2}}]}');
	assert.equal(out.parts[0].rubric.pts, 2);
});

test('throws on text with no JSON in it', () => {
	assert.throws(() => safeParseJSON('Sorry, I could not generate that.'));
});
