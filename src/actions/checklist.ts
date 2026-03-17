"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChecklistItemSchema } from "@/validations/checklist";
import { logActivity } from "@/actions/activity";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function addChecklistItem(
  taskId: string,
  title: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();

  const parsed = addChecklistItemSchema.safeParse({ title });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) return { success: false, error: "Задача не найдена" };

  const maxOrder = await prisma.checklistItem.aggregate({
    where: { taskId },
    _max: { order: true },
  });

  const item = await prisma.checklistItem.create({
    data: {
      title: parsed.data.title,
      taskId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await logActivity(taskId, userId, "CHECKLIST_UPDATED", null, `Добавлен: ${parsed.data.title}`);

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: { id: item.id } };
}

export async function toggleChecklistItem(
  itemId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { task: { select: { projectId: true, id: true } } },
  });
  if (!item) return { success: false, error: "Элемент не найден" };

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      completed: !item.completed,
      completedAt: item.completed ? null : new Date(),
    },
  });

  await logActivity(
    item.task.id,
    userId,
    "CHECKLIST_UPDATED",
    item.completed ? "✓" : "○",
    updated.completed ? "✓" : "○"
  );

  revalidatePath(`/projects/${item.task.projectId}/tasks/${item.task.id}`);
  revalidatePath(`/projects/${item.task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function updateChecklistItem(
  itemId: string,
  title: string
): Promise<ActionResult> {
  await getCurrentUserId();

  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { task: { select: { projectId: true, id: true } } },
  });
  if (!item) return { success: false, error: "Элемент не найден" };

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { title },
  });

  revalidatePath(`/projects/${item.task.projectId}/tasks/${item.task.id}`);
  return { success: true, data: undefined };
}

export async function deleteChecklistItem(itemId: string): Promise<ActionResult> {
  await getCurrentUserId();

  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { task: { select: { projectId: true, id: true } } },
  });
  if (!item) return { success: false, error: "Элемент не найден" };

  await prisma.checklistItem.delete({ where: { id: itemId } });

  revalidatePath(`/projects/${item.task.projectId}/tasks/${item.task.id}`);
  revalidatePath(`/projects/${item.task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function getTaskChecklist(taskId: string) {
  return prisma.checklistItem.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
  });
}
