import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTaskById } from "@/actions/tasks";
import { getProjectTags } from "@/actions/tags";
import { TaskDetailPage } from "@/components/task-detail/task-detail-page";

interface TaskPageProps {
  params: Promise<{ projectId: string; taskId: string }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { projectId, taskId } = await params;

  // Check project access
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) redirect("/projects");

  const result = await getTaskById(taskId);
  if (!result.success || !result.data) notFound();

  const task = result.data;
  if (task.projectId !== projectId) notFound();

  // Get project members for selects
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const members = project.members.map((m) => m.user);
  const tags = await getProjectTags(projectId);

  // Get project tasks for dependency selector
  const projectTasks = await prisma.task.findMany({
    where: { projectId, id: { not: taskId } },
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { title: "asc" },
  });

  return (
    <TaskDetailPage
      task={task}
      projectId={projectId}
      projectName={project.name}
      members={members}
      tags={tags}
      projectTasks={projectTasks}
      currentUserId={session.user.id}
    />
  );
}
