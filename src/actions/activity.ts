"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function logActivity(
  taskId: string,
  userId: string,
  action: string,
  oldValue?: string | null,
  newValue?: string | null
) {
  await prisma.taskActivity.create({
    data: {
      taskId,
      userId,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    },
  });
}

export async function getTaskActivity(taskId: string) {
  await getCurrentUserId();

  return prisma.taskActivity.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
