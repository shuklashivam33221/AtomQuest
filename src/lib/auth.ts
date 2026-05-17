import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authConfig } from "./auth.config";

import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const { handlers, auth: nextAuth, signIn, signOut: nextSignOut } = NextAuth({
  ...authConfig,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID || "mock-entra-id-client-id",
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET || "mock-entra-id-client-secret",
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common"}/v2.0`,
      profile(profile) {
        let role = "EMPLOYEE";
        const groups = (profile as unknown as { groups?: string[] }).groups || [];
        if (groups.includes(process.env.AZURE_AD_ADMIN_GROUP_ID || "") || profile.email?.includes(".adm@") || profile.email?.includes("admin@")) {
          role = "ADMIN";
        } else if (groups.includes(process.env.AZURE_AD_MANAGER_GROUP_ID || "") || profile.email?.includes(".mgr@") || profile.email?.includes("manager@")) {
          role = "MANAGER";
        }
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          role,
        };
      }
    }),
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
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "microsoft-entra-id") {
        if (!user.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          const defaultManager = await prisma.user.findFirst({
            where: { role: "MANAGER" },
          });

          await prisma.user.create({
            data: {
              name: user.name || "Azure User",
              email: user.email,
              password: "",
              role: ((user as { role?: string }).role || "EMPLOYEE") as "EMPLOYEE" | "MANAGER" | "ADMIN",
              managerId: defaultManager?.id || null,
            },
          });
        } else {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name || existingUser.name,
              role: ((user as { role?: string }).role || existingUser.role) as "EMPLOYEE" | "MANAGER" | "ADMIN",
            },
          });
        }
      }
      return true;
    }
  }
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

export async function signOut(...args: Parameters<typeof nextSignOut>) {
  return nextSignOut(...args);
}
