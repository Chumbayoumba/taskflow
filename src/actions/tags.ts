"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTagSchema, updateTagSchema } from "@/validations/tag";
import { logActivity } from "@/actions/activity";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createTag(
  projectId: string,
  data: { name: string; color?: string }
): Promise<ActionResult<{ id: string }>> {
  await getCurrentUserId();

  const parsed = createTagSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.tag.findUnique({
    where: { name_projectId: { name: parsed.data.name, projectId } },
  });
  if (existing) return { success: false, error: "Тег с таким названием уже существует" };

  const tag = await prisma.tag.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color ?? "#6366f1",
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}/board`);
  return { success: true, data: { id: tag.id } };
}

export async function updateTag(
  tagId: string,
  data: { name?: string; color?: string }
): Promise<ActionResult> {
  await getCurrentUserId();

  const parsed = updateTagSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) return { success: false, error: "Тег не найден" };

  await prisma.tag.update({
    where: { id: tagId },
    data: parsed.data,
  });

  revalidatePath(`/projects/${tag.projectId}/board`);
  return { success: true, data: undefined };
}

export async function deleteTag(tagId: string): Promise<ActionResult> {
  await getCurrentUserId();

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) return { success: false, error: "Тег не найден" };

  await prisma.tag.delete({ where: { id: tagId } });

  revalidatePath(`/projects/${tag.projectId}/board`);
  return { success: true, data: undefined };
}

export async function getProjectTags(projectId: string) {
  return prisma.tag.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
}

export async function addTagToTask(
  taskId: string,
  tagId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const [task, tag] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } }),
    prisma.tag.findUnique({ where: { id: tagId }, select: { name: true, projectId: true } }),
  ]);
  if (!task || !tag) return { success: false, error: "Задача или тег не найдены" };
  if (task.projectId !== tag.projectId) {
    return { success: false, error: "Тег не принадлежит проекту задачи" };
  }

  const existing = await prisma.taskTag.findUnique({
    where: { taskId_tagId: { taskId, tagId } },
  });
  if (existing) return { success: false, error: "Тег уже привязан" };

  await prisma.taskTag.create({ data: { taskId, tagId } });

  await logActivity(taskId, userId, "TAG_ADDED", null, tag.name);

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: undefined };
}

export async function removeTagFromTask(
  taskId: string,
  tagId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const [task, tag] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } }),
    prisma.tag.findUnique({ where: { id: tagId }, select: { name: true } }),
  ]);
  if (!task || !tag) return { success: false, error: "Задача или тег не найдены" };

  await prisma.taskTag.delete({
    where: { taskId_tagId: { taskId, tagId } },
  });

  await logActivity(taskId, userId, "TAG_REMOVED", tag.name, null);

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${task.projectId}/board`);
  return { success: true, data: undefined };
}
