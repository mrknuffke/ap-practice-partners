import { defineConfig } from '@playwright/test';

/**
 * Browser smoke suite, run by scripts/preflight/preflight.sh against the
 * production server (`next start`). Signed-out only: nothing here signs in,
 * forges a session cookie, or touches Auth.js. Everything behind sign-in is
 * verified by David (see CLAUDE.md, Verification).
 *
 * Uses the installed Google Chrome (`channel: 'chrome'`); no browser download.
 * Two workers: three starved each other in a sibling repo's suite.
 */
export default defineConfig({
	testDir: 'tests/smoke',
	testMatch: '**/*.smoke.ts',
	snapshotPathTemplate: 'tests/smoke/__snapshots__/{arg}{ext}',
	timeout: 45_000,
	retries: 0,
	workers: 2,
	reporter: [['list']],
	use: {
		baseURL: process.env.PREFLIGHT_BASE_URL || 'http://127.0.0.1:4599',
		channel: 'chrome',
		viewport: { width: 1440, height: 1000 },
	},
});
