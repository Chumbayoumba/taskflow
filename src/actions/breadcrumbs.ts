"use server";

import { prisma } from "@/lib/prisma";

export interface BreadcrumbSegment {
  href: string;
  label: string;
}

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Дашборд",
  projects: "Проекты",
  notifications: "Уведомления",
  settings: "Настройки",
  board: "Доска",
  tasks: "Задачи",
};

const CUID_RE = /^c[a-z0-9]{20,}$/i;

export async function resolveBreadcrumbs(
  pathname: string
): Promise<BreadcrumbSegment[]> {
  const segments = pathname.split("/").filter(Boolean);
  const result: BreadcrumbSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const href = "/" + segments.slice(0, i + 1).join("/");

    // Check static labels first
    const staticLabel = STATIC_LABELS[segment];
    if (staticLabel) {
      result.push({ href, label: staticLabel });
      continue;
    }

    // Dynamic segment — try to resolve from DB
    if (CUID_RE.test(segment)) {
      const prevSegment = segments[i - 1];

      if (prevSegment === "projects") {
        try {
          const project = await prisma.project.findUnique({
            where: { id: segment },
            select: { name: true },
          });
          result.push({ href, label: project?.name || "Проект" });
        } catch {
          result.push({ href, label: "Проект" });
        }
        continue;
      }

      if (prevSegment === "tasks") {
        try {
          const task = await prisma.task.findUnique({
            where: { id: segment },
            select: { title: true },
          });
          result.push({ href, label: task?.title || "Задача" });
        } catch {
          result.push({ href, label: "Задача" });
        }
        continue;
      }

      // Unknown dynamic segment — show generic label
      result.push({ href, label: "..." });
      continue;
    }

    // Fallback: capitalize segment
    result.push({
      href,
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
    });
  }

  return result;
}
