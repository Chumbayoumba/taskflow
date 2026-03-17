/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/dashboard/header";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    id: "user-1",
    name: "Егор",
    email: "egor@test.dev",
    avatarUrl: "/uploads/avatars/user-1.png?t=123",
  }),
}));

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({ unreadCount: 3 }),
}));

vi.mock("@/components/search/search-dialog", () => ({
  SearchDialog: () => null,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    render,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { render?: React.ReactNode }) =>
    render ? (
      <div {...props}>{children}</div>
    ) : (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt ?? "avatar"} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("Header notification badge", () => {
  it("renders unread notification count near the bell icon", () => {
    render(<Header />);

    expect(screen.getByLabelText("3 непрочитанных уведомлений")).toBeInTheDocument();
  });
});
