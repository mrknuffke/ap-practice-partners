import { auth } from "@/auth";

/**
 * Check the Auth.js session and return 401 if not authenticated.
 * Returns the session if valid, or a Response if unauthorized.
 *
 * Usage in API routes:
 *   const result = await requireAuth();
 *   if (result instanceof Response) return result;
 *   // result is the authenticated session
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  return session;
}
