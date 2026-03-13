import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — NO database imports here!
// Credentials provider with DB access is added in auth.ts
export default {
  providers: [],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
