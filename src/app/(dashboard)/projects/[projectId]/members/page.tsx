import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MemberManagement } from "@/components/members/member-management";

interface MembersPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
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
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!project) notFound();

  const currentMember = project.members.find(
    (m) => m.user.id === session.user!.id
  );

  return (
    <div className="max-w-3xl space-y-6">
      <MemberManagement
        projectId={projectId}
        members={project.members}
        currentUserRole={currentMember?.role ?? "MEMBER"}
        currentUserId={session.user!.id!}
      />
    </div>
  );
}
