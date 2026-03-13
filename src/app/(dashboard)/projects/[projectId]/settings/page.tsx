import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectSettings } from "@/components/project/project-settings";

interface SettingsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: {
        some: {
          userId: session.user.id,
          role: { in: ["OWNER", "ADMIN"] },
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  if (!project) notFound();

  const currentRole = project.members[0]?.role ?? "MEMBER";

  return (
    <ProjectSettings
      projectId={projectId}
      project={{
        name: project.name,
        description: project.description,
        color: project.color,
      }}
      currentRole={currentRole}
    />
  );
}
