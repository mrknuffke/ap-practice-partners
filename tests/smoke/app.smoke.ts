import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Signed-out smoke suite. The Gatekeeper wraps every page (src/app/layout.tsx),
 * so a signed-out visitor must get the sign-in card, cleanly, everywhere.
 * Nothing here signs in; screens behind sign-in are verified by David.
 */

function pages(dir = 'src/app'): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) return e.name === 'api' || e.name.startsWith('[') ? [] : pages(p);
		return e.name === 'page.tsx' ? ['/' + path.relative('src/app', dir).split(path.sep).filter(Boolean).join('/')] : [];
	});
}

const slugs = [...fs.readFileSync('src/constants/courses.ts', 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const ROUTES = [...new Set([...pages().map((r) => (r === '/' ? '/' : r)), ...slugs.map((s) => `/tutor/${s}`)])].sort();

/** Text that should never reach a student: raw LaTeX, or HTML shown literally. */
async function leakedMarkup(page: Page) {
	return page.evaluate(() => {
		const BAD = /\\(frac|sqrt|lim|cdot|times|rightarrow)\b|\$\$|\\\(|<\/?(p|div|span|em|strong|sub|sup|br)(\s[^>]*)?>/;
		const hits: string[] = [];
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		for (let n = walker.nextNode(); n; n = walker.nextNode()) {
			if (n.parentElement?.closest('code, pre, script, style, textarea, noscript, .katex')) continue;
			if (BAD.test(n.textContent || '')) hits.push((n.textContent || '').trim().slice(0, 120));
		}
		return hits;
	});
}

for (const route of ROUTES) {
	test(`signed-out ${route} shows the sign-in gate cleanly`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		const res = await page.goto(route);
		expect(res?.status()).toBe(200);
		await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible({ timeout: 15_000 });
		expect(errors, 'uncaught page errors').toEqual([]);
		expect(await leakedMarkup(page), 'raw LaTeX or literal HTML in rendered text').toEqual([]);
	});
}

test('signed-out gate at phone width keeps the sign-in button on screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const button = page.getByRole('button', { name: /sign in with google/i });
	await expect(button).toBeVisible({ timeout: 15_000 });
	const box = await button.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});

test('snapshot: sign-in card', async ({ page }) => {
	await page.goto('/');
	const card = page.getByRole('heading', { name: 'Sign In' }).locator('xpath=..');
	await expect(card).toMatchAriaSnapshot({ name: 'sign-in-card.aria.yml' });
});
