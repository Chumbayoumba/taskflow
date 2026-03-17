/* eslint-disable @next/next/no-img-element */
"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsForm } from "@/components/settings/settings-form";

const mockUpdate = vi.fn();
const mockRefresh = vi.fn();
const mockGetNotificationPrefs = vi.fn();
const mockSaveNotificationPrefs = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({ update: mockUpdate }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/actions/user", () => ({
  getNotificationPrefs: (...args: unknown[]) => mockGetNotificationPrefs(...args),
  saveNotificationPrefs: (...args: unknown[]) => mockSaveNotificationPrefs(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt ?? "avatar"} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("SettingsForm avatar regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotificationPrefs.mockResolvedValue({
      assigned: true,
      statusChanged: true,
      deadline: true,
      invited: true,
    });
    mockSaveNotificationPrefs.mockResolvedValue({ success: true });
    mockUpdateProfile.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ avatarUrl: "/uploads/avatars/user-1.png?t=123" }),
      })
    );
  });

  it("refreshes session and router after successful avatar upload", async () => {
    const { container } = render(
      <SettingsForm
        user={{ id: "user-1", name: "Егор", email: "egor@test.dev", avatarUrl: null }}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        avatarUrl: "/uploads/avatars/user-1.png?t=123",
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("switches preview image to the uploaded avatar url", async () => {
    const { container } = render(
      <SettingsForm
        user={{ id: "user-1", name: "Егор", email: "egor@test.dev", avatarUrl: null }}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByAltText("Егор")).toHaveAttribute(
        "src",
        "/uploads/avatars/user-1.png?t=123"
      )
    );
  });
});
