import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: unknown) => config),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/auth.config", () => ({
  default: {
    providers: [],
    pages: { signIn: "/login" },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { authCallbacks } from "@/auth";

describe("authCallbacks", () => {
  it("merges avatar and name into token on session update trigger", async () => {
    const token = {
      id: "user-1",
      name: "Old Name",
      email: "old@test.dev",
      avatarUrl: null,
    };

    const result = await authCallbacks.jwt({
      token,
      trigger: "update",
      session: {
        name: "New Name",
        avatarUrl: "/uploads/avatars/user-1.png?t=999",
      },
    });

    expect(result.name).toBe("New Name");
    expect(result.avatarUrl).toBe("/uploads/avatars/user-1.png?t=999");
  });

  it("hydrates session user from token including avatar url", async () => {
    const result = await authCallbacks.session({
      session: {
        user: {
          id: "",
          name: "",
          email: "",
        },
      },
      token: {
        id: "user-1",
        name: "Егор",
        email: "egor@test.dev",
        avatarUrl: "/uploads/avatars/user-1.png?t=999",
      },
    });

    expect(result.user?.id).toBe("user-1");
    expect(result.user?.name).toBe("Егор");
    expect(result.user?.email).toBe("egor@test.dev");
    expect(
      (result.user as unknown as Record<string, unknown>).avatarUrl
    ).toBe("/uploads/avatars/user-1.png?t=999");
  });
});
