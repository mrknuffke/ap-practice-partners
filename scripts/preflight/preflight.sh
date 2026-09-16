#!/usr/bin/env bash
# Preflight: the gate every push must pass. Run by the git pre-push hook
# (.githooks/pre-push), by .github/workflows/preflight.yml, and by /ship.
#
# Every push to main deploys https://ap-practice-partners.vercel.app. This
# typechecks and lints, builds and starts the production server under the
# production Node major, confirms every page and course route serves and that
# every API route refuses a signed-out request, then runs the browser smoke suite.
#
#   npm run preflight
#   PREFLIGHT_CLEAN=1 npm run preflight              # npm ci first (CI does this)
#   PREFLIGHT_SKIP_BROWSER=1 npm run preflight       # no Playwright
#   PREFLIGHT_PLAYWRIGHT_ARGS=--update-snapshots npm run preflight   # re-baseline
set -euo pipefail
cd "$(dirname "$0")/../.."

PORT="${PREFLIGHT_PORT:-4599}"
BASE="http://127.0.0.1:${PORT}"
PROD_NODE="$(tr -d '[:space:]v' < .nvmrc)"
LOG="$(mktemp -t ap-preflight-serve.XXXXXX)"
SERVER_PID=""

step() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[31m✗ PREFLIGHT FAILED: %s\033[0m\n' "$*" >&2; exit 1; }
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

# A real binary path, not `npx ... node`: npx forks, so a backgrounded npx PID is
# not the server's, and killing it would orphan the server.
if [ "$(node -p 'process.versions.node.split(".")[0]')" = "$PROD_NODE" ]; then
	PROD_NODE_BIN="$(node -p 'process.execPath')"
else
	PROD_NODE_BIN="$(npx -y -p "node@${PROD_NODE}" node -p 'process.execPath')"
fi

# Auth.js needs a secret to start; the checks below never sign in, so without
# .env.local (CI, a fresh clone) a throwaway value is enough. Never a real one.
if [ ! -f .env.local ]; then
	export AUTH_SECRET="${AUTH_SECRET:-preflight-only-not-a-real-secret}"
	export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-preflight-placeholder}"
	export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-preflight-placeholder}"
	export ALLOWED_DOMAINS="${ALLOWED_DOMAINS:-sas.edu.sg}"
fi

step "Runtime: builds and serves on Node ${PROD_NODE} (.nvmrc); local is $(node -v)"

if [ "${PREFLIGHT_CLEAN:-0}" = "1" ]; then
	step "Clean install"
	npm ci
fi

step "Typecheck"
npx --no-install tsc --noEmit || fail "TypeScript errors"

step "Lint (errors only)"
npx --no-install eslint . --quiet || fail "ESLint errors"

step "Math sanitizer (unrendered-LaTeX fix)"
"$PROD_NODE_BIN" --experimental-strip-types --no-warnings scripts/preflight/check-math-sanitizer.mjs \
	|| fail "sanitizeMathContent no longer converts known LaTeX leaks"

step "Production build under Node ${PROD_NODE}"
"$PROD_NODE_BIN" node_modules/next/dist/bin/next build >"$LOG" 2>&1 || { tail -40 "$LOG"; fail "next build"; }

step "Start the production server under Node ${PROD_NODE}"
if curl -s -o /dev/null --max-time 2 "$BASE/"; then
	fail "port ${PORT} already in use (stale preflight server?) - run: pkill -f 'next/dist/bin/next start -p ${PORT}'"
fi
"$PROD_NODE_BIN" node_modules/next/dist/bin/next start -p "$PORT" -H 127.0.0.1 >"$LOG" 2>&1 &
SERVER_PID=$!
READY=0
for _ in $(seq 1 60); do
	kill -0 "$SERVER_PID" 2>/dev/null || { cat "$LOG"; fail "server exited during boot"; }
	if curl -s -o /dev/null --max-time 2 "$BASE/"; then READY=1; break; fi
	sleep 1
done
[ "$READY" = "1" ] || { cat "$LOG"; fail "server not ready within 60s"; }

step "Routes and API auth"
node scripts/preflight/check-routes.mjs "$BASE" || { tail -30 "$LOG"; fail "route checks"; }

if [ "${PREFLIGHT_SKIP_BROWSER:-0}" != "1" ]; then
	step "Browser smoke suite"
	PREFLIGHT_BASE_URL="$BASE" npx --no-install playwright test ${PREFLIGHT_PLAYWRIGHT_ARGS:-} \
		|| fail "smoke suite"
fi

if grep -qE "⨯|Error:|Unhandled" "$LOG"; then
	grep -E "⨯|Error:|Unhandled" "$LOG" | head -20
	fail "the server logged errors while serving the checks"
fi

printf '\n\033[32m✓ preflight passed\033[0m (Node %s, %s)\n' "$PROD_NODE" "$BASE"
