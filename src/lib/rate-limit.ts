import { type NextRequest } from "next/server";

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

// Returns a 429 Response if rate-limited, otherwise null.
export function rateLimit(
  req: NextRequest,
  route: "tutor" | "generate" | "grade" | "mentor-tip"
): Response | null {
  const ip = getIP(req);
  const HOUR = 60 * 60 * 1000;

  const configs: Record<typeof route, { limit: number; window: number }> = {
    generate:     { limit: 20,  window: HOUR },
    grade:        { limit: 60,  window: HOUR },
    tutor:        { limit: 200, window: HOUR },
    "mentor-tip": { limit: 60,  window: HOUR },
  };

  const { limit, window } = configs[route];
  const allowed = check(`${route}:${ip}`, limit, window);
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }
  return null;
}
