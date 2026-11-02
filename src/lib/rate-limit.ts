import { type NextRequest } from "next/server";
import type { Session } from "next-auth";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function check(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const win = store.get(key);
  if (!win || now >= win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (win.count >= limit) return false;
  win.count++;
  return true;
}

// Limits are per signed-in user, not per IP: a school network can send every
// student out through one shared address, which would make an IP-keyed limit a
// campus-wide limit. The IP is only a fallback for a session with no email.
//
// Counts live in this server instance's memory, so on Vercel each instance keeps
// its own counts and the limit is approximate. A shared store (Upstash / Vercel
// KV) would make it exact.
function clientKey(req: NextRequest, session: Session | null): string {
  const email = session?.user?.email?.trim().toLowerCase();
  return email ? `user:${email}` : `ip:${getIP(req)}`;
}

// Returns a 429 Response if rate-limited, otherwise null.
export function rateLimit(
  req: NextRequest,
  route: "tutor" | "generate" | "grade" | "mentor-tip",
  session: Session | null
): Response | null {
  const HOUR = 60 * 60 * 1000;

  const configs: Record<typeof route, { limit: number; window: number }> = {
    generate:     { limit: 20,  window: HOUR },
    grade:        { limit: 60,  window: HOUR },
    tutor:        { limit: 200, window: HOUR },
    "mentor-tip": { limit: 60,  window: HOUR },
  };

  const { limit, window } = configs[route];
  const allowed = check(`${route}:${clientKey(req, session)}`, limit, window);
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }
  return null;
}
