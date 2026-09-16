#!/usr/bin/env bash
# Claude Code PostToolUse hook (Edit|Write): ESLint on the file just edited.
# --fix applies safe autofixes; errors that remain go back to Claude (exit 2) to
# be fixed in the same turn. Per the two-attempt rule, if the same error survives
# two fixes, stop and show David. The project typecheck runs asynchronously in
# post-edit-async.sh.
set -uo pipefail
cd "$(dirname "$0")/../.."

FILE="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch{}})')"
[ -n "$FILE" ] || exit 0
REL="${FILE#"$PWD"/}"
case "$REL" in /*) exit 0 ;; esac
[ -f "$REL" ] || exit 0

case "$REL" in
	*.ts|*.tsx|*.mjs|*.js)
		if ! OUT="$(npx --no-install eslint --fix --quiet "$REL" 2>&1)"; then
			{ echo "ESLint errors in $REL:"; echo "$OUT" | head -20; } >&2
			exit 2
		fi
		;;
esac
exit 0
