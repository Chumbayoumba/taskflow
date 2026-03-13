import type { Task, Project, User, ProjectMember, Notification } from "@/generated/prisma/client";

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  creator: Pick<User, "id" | "name" | "email">;
};

export type ProjectWithRelations = Project & {
  owner: Pick<User, "id" | "name" | "email">;
  members: (ProjectMember & {
    user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  })[];
  _count: { tasks: number };
};

export type NotificationWithTask = Notification & {
  task: Pick<Task, "id" | "title" | "projectId"> | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
