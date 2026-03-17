"use client";

import { useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

export function useCurrentUser(): SessionUser | null {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return {
    id: session.user.id as string,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    avatarUrl: (session.user as Record<string, unknown>).avatarUrl as string | null ?? null,
  };
}
