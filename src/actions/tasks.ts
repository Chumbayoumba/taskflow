"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/validations/task";
import type { ActionResult, TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/lib/constants";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function checkProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  return !!member;
}

export async function createTask(
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();

  if (!(await checkProjectAccess(projectId, userId))) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    assigneeId: formData.get("assigneeId") || undefined,
    deadline: formData.get("deadline") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Get max order for TODO column
  const maxOrder = await prisma.task.aggregate({
    where: { projectId, status: "TODO" },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      projectId,
      creatorId: userId,
      order: (maxOrder._max.order ?? -1) + 1,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  });

  // Notification for assignee
  if (parsed.data.assigneeId && parsed.data.assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `Вам назначена задача: ${parsed.data.title}`,
        userId: parsed.data.assigneeId,
        taskId: task.id,
      },
    });
  }

  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath("/dashboard");
  return { success: true, data: { id: task.id } };
}

export async function updateTask(
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, assigneeId: true, status: true, title: true },
  });
  if (!task) return { success: false, error: "Задача не найдена" };

  if (!(await checkProjectAccess(task.projectId, userId))) {
    return { success: false, error: "Нет доступа" };
  }

  const data: Record<string, unknown> = {};
  const title = formData.get("title");
  const description = formData.get("description");
  const priority = formData.get("priority");
  const assigneeId = formData.get("assigneeId");
  const deadline = formData.get("deadline");
  const status = formData.get("status");

  if (title) data.title = title;
  if (description !== null) data.description = description || null;
  if (priority) data.priority = priority;
  if (status) data.status = status;
  if (assigneeId !== null) data.assigneeId = assigneeId || null;
  if (deadline !== null)
    data.deadline = deadline ? new Date(deadline as string) : null;

  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: parsed.data as Record<string, unknown>,
  });

  // Notifications
  if (status && status !== task.status) {
    const notifyUserIds = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId)
      notifyUserIds.add(task.assigneeId);

    for (const uid of notifyUserIds) {
      await prisma.notification.create({
        data: {
          type: "TASK_STATUS_CHANGED",
          message: `Задача "${task.title}" → ${status}`,
          userId: uid,
          taskId,
        },
      });
    }
  }

  if (
    assigneeId &&
    assigneeId !== task.assigneeId &&
    assigneeId !== userId
  ) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `Вам назначена задача: ${task.title}`,
        userId: assigneeId as string,
        taskId,
      },
    });
  }

  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, status: true, assigneeId: true, title: true, creatorId: true },
  });
  if (!task) return { success: false, error: "Задача не найдена" };

  if (!(await checkProjectAccess(task.projectId, userId))) {
    return { success: false, error: "Нет доступа" };
  }

  // Update task status and order
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, order: newOrder },
  });

  // Reorder remaining tasks in old column
  if (task.status !== newStatus) {
    // Notify about status change
    const notifyUserIds = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId)
      notifyUserIds.add(task.assigneeId);
    if (task.creatorId !== userId) notifyUserIds.add(task.creatorId);

    for (const uid of notifyUserIds) {
      await prisma.notification.create({
        data: {
          type: "TASK_STATUS_CHANGED",
          message: `Задача "${task.title}" → ${newStatus}`,
          userId: uid,
          taskId,
        },
      });
    }
  }

  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) return { success: false, error: "Задача не найдена" };

  if (!(await checkProjectAccess(task.projectId, userId))) {
    return { success: false, error: "Нет доступа" };
  }

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath(`/projects/${task.projectId}/board`);
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function getProjectTasks(
  projectId: string
): Promise<TaskWithRelations[]> {
  const userId = await getCurrentUserId();

  if (!(await checkProjectAccess(projectId, userId))) {
    return [];
  }

  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
