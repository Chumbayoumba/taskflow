"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema, updateCommentSchema } from "@/validations/comment";
import { logActivity } from "@/actions/activity";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createComment(
  taskId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();

  const parsed = createCommentSchema.safeParse({ content });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true, assigneeId: true, creatorId: true },
  });
  if (!task) return { success: false, error: "Задача не найдена" };

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      taskId,
      authorId: userId,
    },
  });

  await logActivity(taskId, userId, "COMMENT_ADDED", null, parsed.data.content.substring(0, 100));

  // Notify task assignee and creator
  const notifyUserIds = new Set<string>();
  if (task.assigneeId && task.assigneeId !== userId) notifyUserIds.add(task.assigneeId);
  if (task.creatorId !== userId) notifyUserIds.add(task.creatorId);

  for (const uid of notifyUserIds) {
    await prisma.notification.create({
      data: {
        type: "COMMENT_ADDED",
        message: `Новый комментарий к задаче "${task.title}"`,
        userId: uid,
        taskId,
      },
    });
  }

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  return { success: true, data: { id: comment.id } };
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const parsed = updateCommentSchema.safeParse({ content });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, task: { select: { projectId: true, id: true } } },
  });
  if (!comment) return { success: false, error: "Комментарий не найден" };
  if (comment.authorId !== userId) return { success: false, error: "Нет прав на редактирование" };

  await prisma.comment.update({
    where: { id: commentId },
    data: { content: parsed.data.content },
  });

  revalidatePath(`/projects/${comment.task.projectId}/tasks/${comment.task.id}`);
  return { success: true, data: undefined };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, task: { select: { projectId: true, id: true } } },
  });
  if (!comment) return { success: false, error: "Комментарий не найден" };
  if (comment.authorId !== userId) return { success: false, error: "Нет прав на удаление" };

  await prisma.comment.delete({ where: { id: commentId } });

  revalidatePath(`/projects/${comment.task.projectId}/tasks/${comment.task.id}`);
  return { success: true, data: undefined };
}

export async function getTaskComments(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: {
      author: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
