#!/usr/bin/env bash
# Claude Code PostToolUse hook (Edit|Write), async with rewake: whole-project
# typecheck after a .ts/.tsx edit, too slow to block on. Exit 2 wakes Claude.
set -uo pipefail
cd "$(dirname "$0")/../.."

FILE="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||"")}catch{}})')"
REL="${FILE#"$PWD"/}"
case "$REL" in /*|"") exit 0 ;; esac
case "$REL" in *.ts|*.tsx) ;; *) exit 0 ;; esac

LOCK="${TMPDIR:-/tmp}/ap-tutors-tsc.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
	[ -n "$(find "$LOCK" -maxdepth 0 -mmin +10 2>/dev/null)" ] && rm -rf "$LOCK" && mkdir "$LOCK" || exit 0
fi
trap 'rm -rf "$LOCK"' EXIT

if ! OUT="$(npx --no-install tsc --noEmit 2>&1)"; then
	{ echo "TypeScript errors after editing $REL:"; echo "$OUT" | head -25; } >&2
	exit 2
fi
exit 0
