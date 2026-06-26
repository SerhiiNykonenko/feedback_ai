import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "@/env";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";
import { demoPassword, getDemoPermissions, getDemoUserByEmail } from "@/server/demo-data";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            include: {
              roles: {
                include: { role: { include: { permissions: { include: { permission: true } } } } }
              }
            }
          });
          if (!user?.passwordHash || user.status !== "ACTIVE") return null;
          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } catch (error) {
          if (!env.DEMO_AUTH_FALLBACK || !isDatabaseUnavailable(error)) {
            throw error;
          }
          const demoUser = getDemoUserByEmail(parsed.data.email);
          if (!demoUser || parsed.data.password !== demoPassword) return null;
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            image: null,
            teamId: demoUser.teamId,
            roles: demoUser.roles,
            permissions: getDemoPermissions(demoUser.roles)
          };
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const authUser = user as
        | (typeof user & { teamId?: string | null; roles?: string[]; permissions?: string[] })
        | undefined;
      if (authUser?.id) {
        token.sub = authUser.id;
        if (authUser.roles && authUser.permissions) {
          token.teamId = authUser.teamId ?? null;
          token.roles = authUser.roles;
          token.permissions = authUser.permissions;
          return token;
        }
      }
      if (!token.sub) return token;
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            team: true,
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } }
            }
          }
        });
        if (!dbUser) return token;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.picture = dbUser.image;
        token.teamId = dbUser.teamId;
        token.roles = dbUser.roles.map((userRole) => userRole.role.key);
        token.permissions = Array.from(
          new Set(
            dbUser.roles.flatMap((userRole) =>
              userRole.role.permissions.map((rolePermission) => rolePermission.permission.key)
            )
          )
        );
      } catch (error) {
        if (!env.DEMO_AUTH_FALLBACK || !isDatabaseUnavailable(error)) {
          throw error;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.teamId = token.teamId as string | null;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
