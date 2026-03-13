"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult, NotificationWithTask } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getNotifications(): Promise<NotificationWithTask[]> {
  const userId = await getCurrentUserId();

  // Auto-check deadlines on every notification fetch
  try {
    await checkDeadlines();
  } catch {
    // Don't block notification fetch if deadline check fails
  }

  return prisma.notification.findMany({
    where: { userId },
    include: {
      task: { select: { id: true, title: true, projectId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(): Promise<number> {
  const userId = await getCurrentUserId();

  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function checkDeadlines(): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Tasks with deadline in next 24 hours
  const upcomingTasks = await prisma.task.findMany({
    where: {
      deadline: { gte: now, lte: in24h },
      status: { not: "DONE" },
      assigneeId: { not: null },
    },
    select: { id: true, title: true, assigneeId: true },
  });

  for (const task of upcomingTasks) {
    if (!task.assigneeId) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "DEADLINE_WARNING",
        userId: task.assigneeId,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          type: "DEADLINE_WARNING",
          message: `Дедлайн задачи "${task.title}" через менее 24 часов`,
          userId: task.assigneeId,
          taskId: task.id,
        },
      });
    }
  }

  // Overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      deadline: { lt: now },
      status: { not: "DONE" },
      assigneeId: { not: null },
    },
    select: { id: true, title: true, assigneeId: true },
  });

  for (const task of overdueTasks) {
    if (!task.assigneeId) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        taskId: task.id,
        type: "DEADLINE_OVERDUE",
        userId: task.assigneeId,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          type: "DEADLINE_OVERDUE",
          message: `Дедлайн задачи "${task.title}" просрочен!`,
          userId: task.assigneeId,
          taskId: task.id,
        },
      });
    }
  }
}
