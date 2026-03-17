import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const authCallbacks = {
  async jwt({ token, user, trigger, session }) {
    const sessionUpdate = session as Record<string, unknown> | undefined;

    if (user) {
      token.id = user.id;
      token.name = user.name ?? token.name;
      token.email = user.email ?? token.email;
      token.avatarUrl =
        (user as unknown as Record<string, unknown>).avatarUrl ?? null;
    }

    if (trigger === "update" && sessionUpdate) {
      if (typeof sessionUpdate.name === "string") {
        token.name = sessionUpdate.name;
      }
      if ("avatarUrl" in sessionUpdate) {
        token.avatarUrl =
          (sessionUpdate.avatarUrl as string | null | undefined) ?? null;
      }
    }

    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.name =
        (token.name as string | null | undefined) ?? session.user.name ?? "";
      session.user.email =
        (token.email as string | null | undefined) ?? session.user.email ?? "";
      (session.user as unknown as Record<string, unknown>).avatarUrl =
        token.avatarUrl as string | null;
    }
    return session;
  },
  async authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;
    const isOnDashboard =
      nextUrl.pathname.startsWith("/dashboard") ||
      nextUrl.pathname.startsWith("/projects") ||
      nextUrl.pathname.startsWith("/notifications");
    const isOnAuth =
      nextUrl.pathname.startsWith("/login") ||
      nextUrl.pathname.startsWith("/register");

    if (isOnDashboard) {
      if (isLoggedIn) return true;
      return false;
    }

    if (isOnAuth && isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }

    return true;
  },
} satisfies NonNullable<NextAuthConfig["callbacks"]>;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: authCallbacks,
});
