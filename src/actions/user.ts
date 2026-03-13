"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function updateProfile(data: {
  name: string;
}): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: "Имя должно содержать минимум 2 символа" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name.trim() },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function searchGlobal(
  query: string
): Promise<{
  tasks: { id: string; title: string; projectId: string; status: string }[];
  projects: { id: string; name: string; color: string }[];
}> {
  const userId = await getCurrentUserId();

  if (!query || query.trim().length < 2) {
    return { tasks: [], projects: [] };
  }

  const q = query.trim();

  const projects = await prisma.project.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      members: { some: { userId } },
    },
    select: { id: true, name: true, color: true },
    take: 5,
  });

  const tasks = await prisma.task.findMany({
    where: {
      title: { contains: q, mode: "insensitive" },
      project: { members: { some: { userId } } },
    },
    select: { id: true, title: true, projectId: true, status: true },
    take: 10,
  });

  return { tasks, projects };
}
