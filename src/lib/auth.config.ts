import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers are added in auth.ts to avoid Edge Runtime issues with Node APIs
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: unknown }).role = token.role;
        (session.user as { id?: unknown }).id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
