import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // hd is a UI hint that restricts the Google account picker to this domain.
          // It is NOT a security measure — the signIn callback below enforces the real check.
          hd: ALLOWED_DOMAIN || undefined,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      // Security: enforce domain restriction and email verification server-side
      if (!profile?.email_verified) return false;
      if (!ALLOWED_DOMAIN) return true; // no restriction if env var is unset
      return profile.email?.endsWith(`@${ALLOWED_DOMAIN}`) ?? false;
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
