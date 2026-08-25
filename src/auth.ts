import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || process.env.ALLOWED_DOMAIN || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // hd is a UI hint that restricts the Google account picker when a single domain is configured.
          // If multiple domains are allowed, omit hd so users can pick any of their Google accounts.
          // The signIn callback below enforces the real security check.
          hd: ALLOWED_DOMAINS.length === 1 ? ALLOWED_DOMAINS[0] : undefined,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Security: enforce domain restriction and email verification server-side
      if (!profile?.email_verified) return false;
      if (ALLOWED_DOMAINS.length === 0) return true; // no restriction if env var is unset
      const email = profile.email?.toLowerCase() || "";
      return ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`));
    },
    async session({ session, token }) {
      // Expose user info from the JWT into the session object
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
