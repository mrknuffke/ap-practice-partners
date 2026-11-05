import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	stripTags, cleanReply, buildSafeDisplay, extractTagJSON, findTrigger, messageSnippet,
} from '../../src/lib/tutor-tags.ts';

const CONTEXT = ':::context {"mode":"Socratic","alignmentScore":9,"alignmentNote":"On CED","currentObjective":"ENE-1.A","currentUnit":"Unit 3"}:::';

test('cleanReply removes a trailing context block', () => {
	assert.equal(cleanReply(`Good start. What limits the rate?\n${CONTEXT}`), 'Good start. What limits the rate?');
});

test('cleanReply removes trigger and context blocks together', () => {
	const reply = `Try these.\n:::mcq {"unit":"3","format":"independent"}:::\n${CONTEXT}`;
	assert.equal(cleanReply(reply), 'Try these.');
});

test('cleanReply removes a tag whose JSON spans several lines', () => {
	const reply = 'Here we go.\n:::context {\n  "mode": "Practice",\n  "alignmentScore": 8\n}:::';
	assert.equal(cleanReply(reply), 'Here we go.');
});

test('cleanReply keeps a tag with nested JSON whole', () => {
	assert.equal(cleanReply('Ok.\n:::frq {"topic":"X","meta":{"a":1}}:::'), 'Ok.');
});

test('stripTags leaves ordinary text, including a lone :::, alone', () => {
	assert.equal(stripTags('Ratio 3:1, see note ::: below'), 'Ratio 3:1, see note ::: below');
});

test('buildSafeDisplay holds back a tag that is still streaming in', () => {
	assert.equal(buildSafeDisplay('Nice work.\n:::con'), 'Nice work.');
	assert.equal(buildSafeDisplay('Nice work.\n:::context {"mode":"Soc'), 'Nice work.');
	assert.equal(buildSafeDisplay('Nice work.\n:::'), 'Nice work.');
});

test('buildSafeDisplay holds back a multi-line tag while it streams', () => {
	assert.equal(buildSafeDisplay('Nice work.\n:::context {\n  "mode": "Soc'), 'Nice work.');
});

test('buildSafeDisplay shows a stray ::: that cannot become a tag', () => {
	assert.equal(buildSafeDisplay('Use the ::: separator: like this'), 'Use the ::: separator: like this');
});

test('buildSafeDisplay holds back a streaming tag that follows a stray :::', () => {
	assert.equal(buildSafeDisplay('Ratio ::: here.\n:::context {"mode":"Pr'), 'Ratio ::: here.');
});

test('buildSafeDisplay holds back a tag whose closing ::: is only partly in', () => {
	assert.equal(buildSafeDisplay('Done.\n:::context {"mode":"Practice"}::'), 'Done.');
});

test('buildSafeDisplay strips a finished tag mid-stream', () => {
	assert.equal(buildSafeDisplay(`Text.\n${CONTEXT}`), 'Text.');
});

test('extractTagJSON returns the context JSON for the sidebar', () => {
	const raw = extractTagJSON(`Reply.\n${CONTEXT}`, 'context');
	assert.equal(JSON.parse(raw).alignmentScore, 9);
	assert.equal(extractTagJSON('No tags here.', 'context'), null);
});

test('extractTagJSON reads multi-line JSON', () => {
	const raw = extractTagJSON(':::context {\n  "mode": "Practice"\n}:::', 'context');
	assert.equal(JSON.parse(raw).mode, 'Practice');
});

test('findTrigger finds each module trigger', () => {
	assert.deepEqual(findTrigger(':::mcq {"unit":"2","format":"passage"}:::'), { tag: 'mcq', raw: '{"unit":"2","format":"passage"}' });
	assert.equal(findTrigger(':::frq {"topic":"Cell Communication"}:::').tag, 'frq');
	assert.equal(findTrigger(':::source {"topic":"Causation"}:::').tag, 'source');
	assert.equal(findTrigger(':::oral {"topic":"Unit 3 Vocab"}:::').tag, 'oral');
});

test('findTrigger ignores context blocks and plain text', () => {
	assert.equal(findTrigger(`Reply.\n${CONTEXT}`), null);
	assert.equal(findTrigger('Want to try an MCQ?'), null);
});

test('findTrigger prefers mcq, then frq, then source, then oral', () => {
	assert.equal(findTrigger(':::oral {"topic":"a"}::: :::frq {"topic":"b"}:::').tag, 'frq');
});

test('messageSnippet strips tags and markdown and truncates', () => {
	assert.equal(messageSnippet(`**Osmosis** is _passive_.\n${CONTEXT}`), 'Osmosis is passive.');
	const long = messageSnippet('a'.repeat(200));
	assert.equal(long.length, 120);
	assert.ok(long.endsWith('...'));
});

test('messageSnippet returns undefined for non-text or tag-only content', () => {
	assert.equal(messageSnippet(undefined), undefined);
	assert.equal(messageSnippet({ text: 'legacy object' }), undefined);
	assert.equal(messageSnippet(CONTEXT), undefined);
});
