import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";

interface AnalyticsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
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
  });

  if (!project) notFound();

  const [statusCounts, priorityCounts, overdueTasks, totalTasks, doneTasks] =
    await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { projectId },
        _count: true,
      }),
      prisma.task.findMany({
        where: {
          projectId,
          status: { not: "DONE" },
          deadline: { lt: new Date() },
        },
        include: {
          assignee: { select: { name: true } },
        },
        orderBy: { deadline: "asc" },
      }),
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: "DONE" } }),
    ]);

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const statusData = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: statusCounts.find((s) => s.status === key)?._count ?? 0,
    color: config.color,
  }));

  const priorityData = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: priorityCounts.find((p) => p.priority === key)?._count ?? 0,
    color: config.color,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-md"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="text-2xl font-bold">{project.name} — Аналитика</h1>
      </div>

      {/* Completion rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-indigo-600">{completionRate}%</div>
            <p className="text-sm text-slate-500 mt-2">Выполнение</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-slate-900">{totalTasks}</div>
            <p className="text-sm text-slate-500 mt-2">Всего задач</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-rose-600">{overdueTasks.length}</div>
            <p className="text-sm text-slate-500 mt-2">Просрочено</p>
          </CardContent>
        </Card>
      </div>

      {/* Status distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalTasks > 0 ? (item.value / totalTasks) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">По приоритету</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalTasks > 0 ? (item.value / totalTasks) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-rose-600">
              Просроченные задачи ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {overdueTasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-slate-500">
                      Исполнитель: {task.assignee?.name ?? "—"}
                    </p>
                  </div>
                  <div className="text-sm text-rose-600">
                    Дедлайн:{" "}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString("ru-RU")
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
