/**
 * Route checks against a running production server (`next start`).
 *
 * 1. Every page, and every course's tutor route, serves a complete document.
 * 2. Every API route refuses a signed-out request with 401. These routes spend
 *    Gemini quota; one shipped without `requireAuth()` would be open to anyone.
 *    `requireAuth()` runs before any body parsing or model call, so these
 *    requests are free and side-effect-free.
 *
 * Pages and API routes are discovered from src/app, and courses from
 * src/constants/courses.ts, so new ones are covered without editing this file.
 *
 *   node scripts/preflight/check-routes.mjs http://127.0.0.1:4599
 */
import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || 'http://127.0.0.1:4599').replace(/\/$/, '');
const APP = 'src/app';

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name);
		return e.isDirectory() ? walk(p) : [p];
	});
}

const routeOf = (file) => '/' + path.relative(APP, path.dirname(file)).split(path.sep).filter(Boolean).join('/');

const files = walk(APP);
const pages = files
	.filter((f) => f.endsWith('page.tsx') && !f.includes('['))
	.map(routeOf)
	.map((r) => (r === '/.' ? '/' : r));

const slugs = [...fs.readFileSync('src/constants/courses.ts', 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const coursePages = slugs.map((s) => `/tutor/${s}`);

const apiRoutes = files
	.filter((f) => f.endsWith('route.ts') && f.includes(`${path.sep}api${path.sep}`) && !f.includes('[...nextauth]'))
	.map((f) => {
		const src = fs.readFileSync(f, 'utf8');
		const methods = [...src.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
		return { route: routeOf(f), methods };
	});

const ERROR_MARKERS = ['Internal Server Error', 'Application error', 'Unhandled Runtime Error', '[object Object]'];
let failures = 0;
let checks = 0;
const fail = (what, msg) => {
	failures++;
	console.log(`  ✗ ${what} - ${msg}`);
};

for (const route of [...new Set([...pages, ...coursePages])].sort()) {
	checks++;
	try {
		const res = await fetch(base + route, { redirect: 'manual' });
		const body = await res.text();
		if (res.status !== 200) fail(route, `HTTP ${res.status}`);
		else if (ERROR_MARKERS.some((m) => body.includes(m))) fail(route, 'body contains an error marker');
		else if (!body.includes('</html>')) fail(route, 'incomplete HTML document');
	} catch (err) {
		fail(route, `request failed: ${err.message}`);
	}
}

for (const { route, methods } of apiRoutes) {
	if (!methods.length) fail(route, 'no exported handler found');
	for (const method of methods) {
		checks++;
		try {
			const res = await fetch(base + route, {
				method,
				headers: { 'content-type': 'application/json' },
				body: method === 'GET' ? undefined : '{}',
				redirect: 'manual',
			});
			if (res.status !== 401) fail(`${method} ${route}`, `signed-out request got HTTP ${res.status}, expected 401 (missing requireAuth()?)`);
		} catch (err) {
			fail(`${method} ${route}`, `request failed: ${err.message}`);
		}
	}
}

if (failures) {
	console.log(`\n${failures} of ${checks} checks failed.`);
	process.exit(1);
}
console.log(`  ✓ ${pages.length} pages, ${coursePages.length} course routes, ${checks - pages.length - coursePages.length} API handlers refuse signed-out requests`);
