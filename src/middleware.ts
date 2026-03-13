import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Lightweight auth for Edge middleware — no DB imports
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg|og-image.png).*)",
  ],
};
