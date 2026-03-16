"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addDependencySchema } from "@/validations/dependency";
import { logActivity } from "@/actions/activity";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function hasCyclicDependency(
  taskId: string,
  dependsOnId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  if (taskId === dependsOnId) return true;
  if (visited.has(dependsOnId)) return false;
  visited.add(dependsOnId);

  const deps = await prisma.taskDependency.findMany({
    where: { taskId: dependsOnId },
    select: { dependsOnId: true },
  });

  for (const dep of deps) {
    if (await hasCyclicDependency(taskId, dep.dependsOnId, visited)) {
      return true;
    }
  }
  return false;
}

export async function addDependency(
  taskId: string,
  dependsOnId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const parsed = addDependencySchema.safeParse({ dependsOnId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  if (taskId === dependsOnId) {
    return { success: false, error: "Задача не может зависеть от самой себя" };
  }

  const [task, dependsOnTask] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, title: true, assigneeId: true } }),
    prisma.task.findUnique({ where: { id: dependsOnId }, select: { projectId: true, title: true, assigneeId: true } }),
  ]);
  if (!task || !dependsOnTask) return { success: false, error: "Задача не найдена" };
  if (task.projectId !== dependsOnTask.projectId) {
    return { success: false, error: "Задачи должны быть в одном проекте" };
  }

  // Check for cycles
  if (await hasCyclicDependency(taskId, dependsOnId)) {
    return { success: false, error: "Циклическая зависимость обнаружена" };
  }

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });
  if (existing) return { success: false, error: "Зависимость уже существует" };

  await prisma.taskDependency.create({
    data: { taskId, dependsOnId },
  });

  await logActivity(taskId, userId, "DEPENDENCY_ADDED", null, dependsOnTask.title);

  if (task.assigneeId && task.assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        type: "DEPENDENCY_ADDED",
        message: `Задача "${task.title}" теперь зависит от "${dependsOnTask.title}"`,
        userId: task.assigneeId,
        taskId,
      },
    });
  }

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function removeDependency(
  taskId: string,
  dependsOnId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const dep = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
    include: {
      dependsOn: { select: { title: true } },
      task: { select: { projectId: true } },
    },
  });
  if (!dep) return { success: false, error: "Зависимость не найдена" };

  await prisma.taskDependency.delete({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });

  await logActivity(taskId, userId, "DEPENDENCY_REMOVED", dep.dependsOn.title, null);

  revalidatePath(`/projects/${dep.task.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${dep.task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function getTaskDependencies(taskId: string) {
  const [dependencies, dependedOnBy] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
    }),
  ]);

  return { dependencies, dependedOnBy };
}
