"use client";

import { TaskHeader } from "./task-header";
import { TaskDescription } from "./task-description";
import { TaskSidebar } from "./task-sidebar";
import { TaskChecklist } from "./task-checklist";
import { TaskComments } from "./task-comments";
import { TaskDependencies } from "./task-dependencies";
import { TaskTags } from "./task-tags";
import { TaskActivity } from "./task-activity";
import type { TaskWithDetails } from "@/types";
import type { Tag, Task } from "@/generated/prisma/client";

interface TaskDetailPageProps {
  task: TaskWithDetails;
  projectId: string;
  projectName: string;
  members: { id: string; name: string; email: string; avatarUrl: string | null }[];
  tags: Tag[];
  projectTasks: Pick<Task, "id" | "title" | "status" | "priority">[];
  currentUserId: string;
}

export function TaskDetailPage({
  task,
  projectId,
  projectName,
  members,
  tags,
  projectTasks,
  currentUserId,
}: TaskDetailPageProps) {
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      <TaskHeader task={task} projectId={projectId} projectName={projectName} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <TaskDescription task={task} />
          <TaskChecklist taskId={task.id} items={task.checklistItems} />
          <TaskDependencies
            taskId={task.id}
            dependencies={task.dependencies}
            dependedOnBy={task.dependedOnBy}
            projectTasks={projectTasks}
            projectId={projectId}
          />
          <TaskComments
            taskId={task.id}
            comments={task.comments}
            currentUserId={currentUserId}
          />
          <TaskActivity activities={task.activities} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TaskSidebar task={task} members={members} projectId={projectId} />
          <TaskTags
            taskId={task.id}
            taskTags={task.taskTags}
            projectTags={tags}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  );
}
