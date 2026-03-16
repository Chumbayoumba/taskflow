import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const ACTIVITY_LABELS: Record<string, string> = {
  CREATED: "создал(а) задачу",
  STATUS_CHANGED: "изменил(а) статус",
  ASSIGNED: "назначил(а) исполнителя",
  PRIORITY_CHANGED: "изменил(а) приоритет",
  COMMENT_ADDED: "добавил(а) комментарий",
  CHECKLIST_UPDATED: "обновил(а) чеклист",
  TAG_ADDED: "добавил(а) тег",
  TAG_REMOVED: "удалил(а) тег",
  DEPENDENCY_ADDED: "добавил(а) зависимость",
  DEPENDENCY_REMOVED: "удалил(а) зависимость",
};

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

  const [
    statusCounts,
    priorityCounts,
    overdueTasks,
    totalTasks,
    doneTasks,
    tagCounts,
    tags,
    checklistStats,
    checklistCompleted,
    recentActivity,
    teamWorkload,
    projectMembers,
  ] = await Promise.all([
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
    prisma.taskTag.groupBy({
      by: ["tagId"],
      where: { task: { projectId } },
      _count: true,
    }),
    prisma.tag.findMany({
      where: { projectId },
    }),
    prisma.checklistItem.aggregate({
      where: { task: { projectId } },
      _count: true,
    }),
    prisma.checklistItem.count({
      where: { task: { projectId }, completed: true },
    }),
    prisma.taskActivity.findMany({
      where: { task: { projectId } },
      include: {
        user: { select: { name: true } },
        task: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.task.groupBy({
      by: ["assigneeId", "status"],
      where: { projectId, assigneeId: { not: null } },
      _count: true,
    }),
    prisma.user.findMany({
      where: { memberships: { some: { projectId } } },
      select: { id: true, name: true },
    }),
  ]);

  const checklistTotal = checklistStats._count;
  const checklistPercent =
    checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const statusData = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: statusCounts.find((s) => s.status === key)?._count ?? 0,
    color: config.hex,
  }));

  const priorityData = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: priorityCounts.find((p) => p.priority === key)?._count ?? 0,
    color: config.hex,
  }));

  const tagData = tagCounts
    .map((tc) => {
      const tag = tags.find((t) => t.id === tc.tagId);
      return tag ? { name: tag.name, color: tag.color, value: tc._count } : null;
    })
    .filter(Boolean) as { name: string; color: string; value: number }[];

  const totalTaggedTasks = tagData.reduce((sum, t) => sum + t.value, 0);

  const workloadMap = new Map<
    string,
    { name: string; total: number; inProgress: number; done: number }
  >();
  for (const member of projectMembers) {
    workloadMap.set(member.id, { name: member.name ?? "Без имени", total: 0, inProgress: 0, done: 0 });
  }
  for (const row of teamWorkload) {
    if (!row.assigneeId) continue;
    const entry = workloadMap.get(row.assigneeId);
    if (!entry) continue;
    entry.total += row._count;
    if (row.status === "IN_PROGRESS") entry.inProgress += row._count;
    if (row.status === "DONE") entry.done += row._count;
  }
  const workloadData = Array.from(workloadMap.values()).filter((w) => w.total > 0);

  return (
    <div className="space-y-6">
      {/* Completion rate */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-emerald-600">
              {checklistCompleted}/{checklistTotal}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Чеклист {checklistPercent}%
            </p>
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

      {/* Tags + Team workload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По тегам</CardTitle>
          </CardHeader>
          <CardContent>
            {tagData.length > 0 ? (
              <div className="space-y-3">
                {tagData.map((item) => (
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
                            width: `${totalTaggedTasks > 0 ? (item.value / totalTaggedTasks) * 100 : 0}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Нет тегов</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Нагрузка команды</CardTitle>
          </CardHeader>
          <CardContent>
            {workloadData.length > 0 ? (
              <div className="space-y-3">
                {workloadData.map((member) => (
                  <div key={member.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {member.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Всего: {member.total}</span>
                      <span className="text-blue-600">В работе: {member.inProgress}</span>
                      <span className="text-emerald-600">Готово: {member.done}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Нет назначенных задач</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Последняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.user?.name ?? "Пользователь"}
                      </span>{" "}
                      {ACTIVITY_LABELS[activity.action] ?? activity.action}{" "}
                      <span className="text-slate-500">
                        — {activity.task?.title}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
