"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema, updateProjectSchema } from "@/validations/project";
import type { ActionResult, ProjectWithRelations } from "@/types";
import { revalidatePath } from "next/cache";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createProject(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#6366f1",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, data: { id: project.id } };
}

export async function getProjects(): Promise<ProjectWithRelations[]> {
  const userId = await getCurrentUserId();

  return prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(
  projectId: string
): Promise<ProjectWithRelations | null> {
  const userId = await getCurrentUserId();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  return project;
}

export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!member) return { success: false, error: "Нет доступа" };

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true, data: undefined };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return { success: false, error: "Только владелец может удалить проект" };

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function addMember(
  projectId: string,
  email: string,
  role: string = "MEMBER"
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!member) return { success: false, error: "Нет доступа" };

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return { success: false, error: "Пользователь не найден" };

  const existingMember = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUser.id, projectId } },
  });
  if (existingMember) return { success: false, error: "Пользователь уже в проекте" };

  await prisma.projectMember.create({
    data: { userId: targetUser.id, projectId, role },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      type: "PROJECT_INVITED",
      message: `Вас пригласили в проект`,
      userId: targetUser.id,
    },
  });

  revalidatePath(`/projects/${projectId}/members`);
  return { success: true, data: undefined };
}

export async function removeMember(
  projectId: string,
  targetUserId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!member) return { success: false, error: "Нет доступа" };

  if (targetUserId === userId) {
    return { success: false, error: "Нельзя удалить себя" };
  }

  await prisma.projectMember.deleteMany({
    where: { projectId, userId: targetUserId },
  });

  revalidatePath(`/projects/${projectId}/members`);
  return { success: true, data: undefined };
}
