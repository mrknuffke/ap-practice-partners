/**
 * Parsing for the `:::tag {json}:::` blocks the tutor appends to its replies
 * (see PICKUP.md, *Sidebar Tag System*). Pure functions with no imports, so
 * tests/unit can run them under Node's type stripping without a bundler.
 */

export const TRIGGER_TAGS = ["mcq", "frq", "source", "oral"] as const;
export type TriggerTag = (typeof TRIGGER_TAGS)[number];

// A complete tag block. `[\s\S]*?` lets the JSON span lines (the model
// sometimes pretty-prints it) and stops at the first `}` that is followed by
// the closing `:::`, so nested objects are kept whole.
const TAG_BLOCK = /\n?:::(?:mcq|frq|source|oral|context)\s*\{[\s\S]*?\}\s*:::/g;
const TAG_NAMES: readonly string[] = [...TRIGGER_TAGS, "context"];

// True if `rest` (the text after an opening `:::`) could still grow into a
// tag: empty, a prefix of a tag name, or a full tag name followed by an
// opening brace and JSON that has not closed yet. JSON contains colons, so
// this cannot be a "no colon after :::" test.
function couldBecomeTag(rest: string): boolean {
  const word = /^[a-z]*/.exec(rest)![0];
  const after = rest.slice(word.length);
  if (after === "") return TAG_NAMES.some(name => name.startsWith(word));
  return TAG_NAMES.includes(word) && /^\s*(\{[\s\S]*)?$/.test(after);
}

/** Removes every complete tag block. */
export function stripTags(text: string): string {
  return text.replace(TAG_BLOCK, "");
}

/** The final, displayed form of a finished reply: tags removed, trailing space trimmed. */
export function cleanReply(text: string): string {
  return stripTags(text).trimEnd();
}

/**
 * The display-safe form of a reply that is still streaming: complete tags are
 * removed, and a tag that has started but not closed is held back, so raw
 * `:::context{...` JSON never flashes on screen. A stray `:::` that cannot
 * become a tag is shown as written.
 */
export function buildSafeDisplay(text: string): string {
  const stripped = stripTags(text);
  // Complete tags are gone, so an unfinished one is opened by the last `:::`.
  const openIdx = stripped.lastIndexOf(":::");
  if (openIdx === -1 || !couldBecomeTag(stripped.slice(openIdx + 3))) return stripped;
  const cut = stripped[openIdx - 1] === "\n" ? openIdx - 1 : openIdx;
  return stripped.slice(0, cut);
}

/** The raw JSON text inside the first `:::name {...}:::` block, or null. */
export function extractTagJSON(text: string, name: TriggerTag | "context"): string | null {
  const match = text.match(new RegExp(`:::${name}\\s*(\\{[\\s\\S]*?\\})\\s*:::`));
  return match ? match[1] : null;
}

/**
 * The practice module a reply asks to launch, if any. When a reply carries
 * more than one trigger, the first in TRIGGER_TAGS order wins (mcq, frq,
 * source, oral), matching the order the tutor page has always used.
 */
export function findTrigger(text: string): { tag: TriggerTag; raw: string } | null {
  for (const tag of TRIGGER_TAGS) {
    const raw = extractTagJSON(text, tag);
    if (raw !== null) return { tag, raw };
  }
  return null;
}

/** A one-line preview of a stored message for the resume prompt, or undefined if it has no text. */
export function messageSnippet(content: unknown, max = 120): string | undefined {
  if (typeof content !== "string" || !content) return undefined;
  const clean = stripTags(content).replace(/[#*_`]/g, "").trim();
  if (!clean) return undefined;
  return clean.length > max ? clean.slice(0, max - 3) + "..." : clean;
}
