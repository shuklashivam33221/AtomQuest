import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authConfig } from "./auth.config";

const { handlers, auth: nextAuth, signIn, signOut: nextSignOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch)
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
        }

        return null;
      },
    }),
  ],
});

export { handlers, signIn };

export async function auth() {
  if (process.env.MOCK_SESSION) {
    try {
      return JSON.parse(process.env.MOCK_SESSION);
    } catch {
      return null;
    }
  }
  return nextAuth();
}

export async function signOut(...args: any[]) {
  return nextSignOut(...args);
}
