"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/validations/task";
import type { ActionResult, TaskWithRelations, TaskWithDetails, TaskCardData } from "@/types";
import type { TaskStatus } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

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

  const rawAssigneeId = formData.get("assigneeId") as string | null;
  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    assigneeId: rawAssigneeId && rawAssigneeId !== "unassigned" ? rawAssigneeId : undefined,
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

  // Notification for assignee (including self-assignment)
  if (parsed.data.assigneeId) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `Вам назначена задача: ${parsed.data.title}`,
        userId: parsed.data.assigneeId,
        taskId: task.id,
      },
    });
  }

  // Notify project owner and admins about new task
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      members: { where: { role: "ADMIN" }, select: { userId: true } },
    },
  });

  if (project) {
    const notifyUserIds = new Set<string>();
    notifyUserIds.add(project.ownerId);
    for (const member of project.members) {
      notifyUserIds.add(member.userId);
    }
    notifyUserIds.delete(userId);
    if (parsed.data.assigneeId) {
      notifyUserIds.delete(parsed.data.assigneeId);
    }

    for (const uid of notifyUserIds) {
      await prisma.notification.create({
        data: {
          type: "TASK_CREATED",
          message: `Создана новая задача: ${parsed.data.title}`,
          userId: uid,
          taskId: task.id,
        },
      });
    }
  }

  // Log activity
  await logActivity(task.id, userId, "CREATED");

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
    select: { projectId: true, assigneeId: true, status: true, title: true, priority: true },
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
  if (assigneeId !== null) data.assigneeId = (assigneeId && assigneeId !== "unassigned") ? assigneeId : null;
  if (deadline !== null) data.deadline = (deadline as string) || null;

  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (typeof updateData.deadline === "string") {
    updateData.deadline = new Date(updateData.deadline);
  }

  await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  // Log activity for each changed field
  if (status && status !== task.status) {
    await logActivity(taskId, userId, "STATUS_CHANGED", task.status, status as string);
  }
  if (priority && priority !== task.priority) {
    await logActivity(taskId, userId, "PRIORITY_CHANGED", task.priority ?? undefined, priority as string);
  }
  if (title && title !== task.title) {
    await logActivity(taskId, userId, "TITLE_CHANGED", task.title, title as string);
  }
  const newAssigneeRaw = updateData.assigneeId as string | null | undefined;
  if (newAssigneeRaw !== undefined && newAssigneeRaw !== task.assigneeId) {
    await logActivity(taskId, userId, "ASSIGNED", task.assigneeId ?? undefined, newAssigneeRaw ?? undefined);
  }

  // Notifications for status change (assignee, creator, owner, admins)
  if (status && status !== task.status) {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: {
        ownerId: true,
        members: { where: { role: "ADMIN" }, select: { userId: true } },
      },
    });

    const notifyUserIds = new Set<string>();
    if (task.assigneeId) notifyUserIds.add(task.assigneeId);
    if (project) {
      notifyUserIds.add(project.ownerId);
      for (const member of project.members) {
        notifyUserIds.add(member.userId);
      }
    }
    notifyUserIds.delete(userId);

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

  const newAssigneeId = newAssigneeRaw;
  if (
    newAssigneeId &&
    newAssigneeId !== task.assigneeId
  ) {
    await prisma.notification.create({
      data: {
        type: "TASK_ASSIGNED",
        message: `Вам назначена задача: ${task.title}`,
        userId: newAssigneeId,
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
    select: {
      projectId: true,
      status: true,
      assigneeId: true,
      title: true,
      creatorId: true,
      project: {
        select: {
          ownerId: true,
          members: { where: { role: "ADMIN" }, select: { userId: true } },
        },
      },
    },
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
    // Log activity
    await logActivity(taskId, userId, "STATUS_CHANGED", task.status, newStatus);

    // Notify about status change (assignee, creator, owner, admins)
    const notifyUserIds = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId)
      notifyUserIds.add(task.assigneeId);
    if (task.creatorId !== userId) notifyUserIds.add(task.creatorId);
    if (task.project.ownerId !== userId) notifyUserIds.add(task.project.ownerId);
    for (const member of task.project.members) {
      if (member.userId !== userId) notifyUserIds.add(member.userId);
    }

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

export async function getProjectTasksForBoard(
  projectId: string
): Promise<TaskCardData[]> {
  const userId = await getCurrentUserId();

  if (!(await checkProjectAccess(projectId, userId))) {
    return [];
  }

  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
      taskTags: { include: { tag: true } },
      checklistItems: { select: { id: true, completed: true } },
      _count: { select: { comments: true, checklistItems: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  }) as unknown as TaskCardData[];
}

export async function getTaskById(
  taskId: string
): Promise<ActionResult<TaskWithDetails>> {
  const userId = await getCurrentUserId();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      checklistItems: {
        orderBy: { order: "asc" },
      },
      dependencies: {
        include: {
          dependsOn: { select: { id: true, title: true, status: true, priority: true } },
        },
      },
      dependedOnBy: {
        include: {
          task: { select: { id: true, title: true, status: true, priority: true } },
        },
      },
      taskTags: {
        include: { tag: true },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!task) {
    return { success: false, error: "Задача не найдена" };
  }

  if (!(await checkProjectAccess(task.projectId, userId))) {
    return { success: false, error: "Нет доступа" };
  }

  return { success: true, data: task as unknown as TaskWithDetails };
}
