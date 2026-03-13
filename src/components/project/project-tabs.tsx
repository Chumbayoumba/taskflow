"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectTabsProps {
  projectId: string;
  canManage: boolean;
}

const tabs = [
  { id: "board", label: "Доска", icon: LayoutGrid, href: (id: string) => `/projects/${id}/board` },
  { id: "members", label: "Участники", icon: Users, href: (id: string) => `/projects/${id}/members` },
  { id: "analytics", label: "Аналитика", icon: BarChart3, href: (id: string) => `/projects/${id}/analytics` },
  { id: "settings", label: "Настройки", icon: Settings, href: (id: string) => `/projects/${id}/settings`, requireManage: true },
];

export function ProjectTabs({ projectId, canManage }: ProjectTabsProps) {
  const pathname = usePathname();

  const visibleTabs = tabs.filter((t) => !t.requireManage || canManage);

  return (
    <div className="border-b">
      <nav className="flex gap-1 -mb-px">
        {visibleTabs.map((tab) => {
          const href = tab.href(projectId);
          const isActive = pathname.includes(`/${tab.id}`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
