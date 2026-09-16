// Logic for pre-write.sh: refuses writing code that mints or plants an Auth.js
// session anywhere except the files that implement sign-in for real.
//
// pre-bash.sh only sees command lines; `npx tsx scripts/mint.ts` carries no auth
// words of its own. This closes that gap where the code is written.
import fs from 'node:fs';

const root = process.argv[2];
let j;
try {
	j = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
	process.exit(0);
}
const input = j.tool_input || {};
const file = input.file_path || '';
const text = [input.content, input.new_string].filter(Boolean).join('\n');
if (!text) process.exit(0);

const rel = file.startsWith(root + '/') ? file.slice(root.length + 1) : file;
const ALLOWED = [
	/^src\/auth\.ts$/,
	/^src\/lib\/auth-guard\.ts$/,
	/^src\/app\/api\/auth\//,
	/^src\/components\/Gatekeeper\.tsx$/,
	/^CLAUDE\.md$/,
	/^AGENTS\.md$/,
	/^PICKUP\.md$/,
	/^docs\//,
];
if (ALLOWED.some((re) => re.test(rel))) process.exit(0);

const mints = /from\s+['"](next-auth\/jwt|@auth\/core\/jwt)['"]|\bencode\s*\(\s*\{[\s\S]{0,200}\bsecret\b|\bSignJWT\b|\bjwt\.sign\s*\(/.test(text);
const plants = /(authjs|next-auth)\.session-token/.test(text) && /(addCookies|document\.cookie|setCookie|Cookie:)/.test(text);

if (mints || plants) {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason:
					`Refusing to write session-minting or cookie-planting code to ${rel || file}. ` +
					'Never forge credentials or bypass Google sign-in (~/.claude/CLAUDE.md, Verification). ' +
					'For screens behind sign-in, /verify-ui hands David a checklist.',
			},
		})
	);
}
