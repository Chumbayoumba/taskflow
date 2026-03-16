"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckSquare,
  Menu,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/projects", label: "Проекты", icon: FolderKanban },
  { href: "/notifications", label: "Уведомления", icon: Bell },
  { href: "/settings", label: "Настройки", icon: Settings },
];

function SidebarContent({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { unreadCount } = useNotifications();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CheckSquare className="size-6 shrink-0 text-indigo-400" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">TaskFlow</span>
          )}
        </Link>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="ml-auto size-8 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        )}
      </div>

      <Separator className="bg-slate-700" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        <TooltipProvider>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const showBadge = item.href === "/notifications" && unreadCount > 0;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
              >
                <div className="relative shrink-0">
                  <Icon className="size-5" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={<div />}>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </TooltipProvider>
      </nav>

      <Separator className="bg-slate-700" />

      {/* User profile */}
      <div className={cn("p-3", collapsed && "flex justify-center")}>
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-indigo-600 text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">Выйти</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar size="default">
              <AvatarFallback className="bg-indigo-600 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="size-8 shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-slate-800 transition-all duration-300 md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-3 top-3 z-40 bg-white shadow-md md:hidden"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Навигация</SheetTitle>
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
