#!/usr/bin/env bash
# Claude Code PreToolUse hook (Bash): refuses the escape hatches that have cost
# real time in past sessions, so they are structurally unavailable rather than
# merely discouraged. The worst of these happened in this repo: minting fake
# Auth.js session tokens and building a Playwright harness to get past Google
# sign-in for a screenshot ("You're just running around and around").
set -uo pipefail
CMD="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input.command||"")}catch{}})')"

deny() {
	node -e 'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:process.argv[1]}}))' "$1"
	exit 0
}

# Patterns are anchored to command position (line start or after ; & | ( ), so
# a heredoc, grep or commit message that merely mentions these is not blocked.
AT='(^|[;&|(][[:space:]]*)([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*'

# --- Deploy gate ------------------------------------------------------------
if printf '%s' "$CMD" | grep -Eq "${AT}git[[:space:]]+push[^;&|]*(--no-verify|[[:space:]]-n([[:space:]]|$))"; then
	deny "Pushing with --no-verify skips preflight, and every push to main deploys ap-practice-partners.vercel.app. Run npm run preflight, fix what it reports, then push normally."
fi
if printf '%s' "$CMD" | grep -Eq "${AT}git[[:space:]]+config[^;&|]*core\.hooksPath" \
	&& ! printf '%s' "$CMD" | grep -Eq "${AT}git[[:space:]]+config[[:space:]]+((--get|--local)[[:space:]]+)?core\.hooksPath([[:space:]]+\.githooks)?[[:space:]]*(\$|[;&|])"; then
	deny "Changing core.hooksPath would disable the pre-push preflight."
fi

# --- Ad-hoc browser automation ------------------------------------------------
# The sanctioned path is the committed smoke suite (npm run preflight) or /verify-ui.
if printf '%s' "$CMD" | grep -Eq "${AT}((npx[[:space:]]+)?playwright[[:space:]]+install|(npm|pnpm|yarn)[[:space:]]+(i|install|add)[^;&|]*(puppeteer|playwright|selenium)|pip3?[[:space:]]+install[^;&|]*(playwright|selenium))"; then
	deny "Installing browser automation ad hoc is off the table (~/.claude/CLAUDE.md, Verification). Use the committed smoke suite (npm run preflight) or /verify-ui; for anything behind sign-in, ask David to look."
fi

# --- Forged auth --------------------------------------------------------------
# Encoding an Auth.js session, or planting its cookie, from a script, one-liner,
# or browser automation. Reading or grepping auth code is fine; executing code
# that mints or plants a session is not.
if printf '%s' "$CMD" | grep -Eq "${AT}(node|npx|tsx|ts-node|bun|deno|python3?|osascript|curl)([[:space:]]|$)" \
	&& printf '%s' "$CMD" | grep -Eq "(next-auth/jwt|@auth/core/jwt|encode\\(|authjs\.session-token|next-auth\.session-token|AUTH_SECRET|SignJWT|jwt\.sign|addCookies|document\.cookie)"; then
	deny "This looks like minting or planting an Auth.js session. Never forge credentials or bypass Google sign-in (~/.claude/CLAUDE.md, Verification). For screens behind sign-in, use /verify-ui, which hands David a checklist."
fi
exit 0
