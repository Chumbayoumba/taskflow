import type { Task, Project, User, ProjectMember, Notification, Comment, ChecklistItem, TaskDependency, Tag, TaskTag, TaskActivity } from "@/generated/prisma/client";

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  creator: Pick<User, "id" | "name" | "email">;
};

export type TaskWithDetails = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  creator: Pick<User, "id" | "name" | "email" | "avatarUrl">;
  comments: CommentWithAuthor[];
  checklistItems: ChecklistItem[];
  dependencies: (TaskDependency & {
    dependsOn: Pick<Task, "id" | "title" | "status" | "priority">;
  })[];
  dependedOnBy: (TaskDependency & {
    task: Pick<Task, "id" | "title" | "status" | "priority">;
  })[];
  taskTags: (TaskTag & {
    tag: Tag;
  })[];
  activities: TaskActivityWithUser[];
};

export type TaskCardData = Task & {
  assignee: Pick<User, "id" | "name" | "email" | "avatarUrl"> | null;
  creator: Pick<User, "id" | "name" | "email">;
  taskTags: (TaskTag & { tag: Tag })[];
  _count: {
    comments: number;
    checklistItems: number;
  };
  checklistItems: Pick<ChecklistItem, "id" | "completed">[];
};

export type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "name" | "email" | "avatarUrl">;
};

export type TaskActivityWithUser = TaskActivity & {
  user: Pick<User, "id" | "name" | "email" | "avatarUrl">;
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

export type BoardFilters = {
  assigneeIds: string[];
  priorities: string[];
  tagIds: string[];
  deadlineFilter: "all" | "overdue" | "today" | "this_week" | "no_deadline";
};
