#!/usr/bin/env bash
# Claude Code PreToolUse hook (Write|Edit): refuses writing Auth.js
# session-minting or cookie-planting code outside the real auth files.
# Logic lives in pre-write-check.mjs.
set -uo pipefail
cd "$(dirname "$0")/../.."
node scripts/claude-hooks/pre-write-check.mjs "$PWD"
exit 0
