import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project/project-tabs";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!project) notFound();

  const currentRole = project.members[0]?.role ?? "MEMBER";
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-md shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-2xl font-bold truncate">{project.name}</h1>
        </div>
      </div>

      <ProjectTabs projectId={projectId} canManage={canManage} />

      <div>{children}</div>
    </div>
  );
}
