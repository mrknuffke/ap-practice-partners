import { jsonrepair } from "jsonrepair";

/**
 * Parses JSON from a model response. Gemini sometimes wraps JSON in markdown
 * fences, adds prose around it, or emits bad escape sequences: strip fences,
 * cut to the outermost object or array, and fall back to jsonrepair.
 * Throws if the text holds no JSON object or array (a plain-text refusal, say),
 * so callers land in their error path instead of rendering a string.
 */
export function safeParseJSON<T>(raw: string): T {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const start = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket) ? firstBrace : firstBracket;
  if (start === -1) throw new SyntaxError("No JSON object or array in model response");
  const end = s[start] === "{" ? s.lastIndexOf("}") : s.lastIndexOf("]");
  if (end !== -1) s = s.slice(start, end + 1);
  // `\f` and `\b` are legal JSON escapes (form feed, backspace), so a model
  // writing LaTeX like \frac or \beta unescaped would silently lose the letter
  // and show "rac{1}{2}". Nobody means a form feed here: keep the backslash.
  s = s.replace(/(?<!\\)\\([fb])(?=[a-zA-Z])/g, "\\\\$1");
  let parsed: unknown;
  try {
    parsed = JSON.parse(s);
  } catch {
    parsed = JSON.parse(jsonrepair(s));
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new SyntaxError("Model response is not a JSON object or array");
  }
  return parsed as T;
}

export async function safeResponseJSON<T>(res: Response): Promise<T> {
  return safeParseJSON<T>(await res.text());
}
