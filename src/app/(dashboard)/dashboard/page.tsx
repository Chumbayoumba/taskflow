import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch stats
  const [totalTasks, inProgressTasks, overdueTasks, doneTasks, recentTasks, projects] =
    await Promise.all([
      prisma.task.count({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
          status: "IN_PROGRESS",
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
          status: { not: "DONE" },
          deadline: { lt: new Date() },
        },
      }),
      prisma.task.count({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
          status: "DONE",
        },
      }),
      prisma.task.findMany({
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
        },
        include: {
          project: { select: { name: true, color: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: { _count: { select: { tasks: true } } },
        orderBy: { updatedAt: "desc" },
        take: 4,
      }),
    ]);

  const stats = [
    {
      title: "Всего задач",
      value: totalTasks,
      icon: ListTodo,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "В работе",
      value: inProgressTasks,
      icon: Clock,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "Просрочено",
      value: overdueTasks,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "Завершено",
      value: doneTasks,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Добро пожаловать, {session.user.name}! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Вот что происходит с вашими проектами
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Новый проект
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Проекты</h2>
          <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
            Все проекты →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}/board`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-medium truncate">{project.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {project._count.tasks} задач
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {projects.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center text-slate-500">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>У вас пока нет проектов</p>
                <Link href="/projects/new">
                  <Button variant="outline" className="mt-3">
                    Создать первый проект
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Последние задачи</h2>
        <Card>
          <CardContent className="p-0">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Нет задач
              </div>
            ) : (
              <div className="divide-y">
                {recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}/board`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            task.status === "DONE"
                              ? "#10b981"
                              : task.status === "IN_PROGRESS"
                              ? "#0ea5e9"
                              : task.status === "REVIEW"
                              ? "#8b5cf6"
                              : "#94a3b8",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-xs text-slate-400">
                          {task.project.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.priority === "URGENT"
                            ? "border-rose-300 text-rose-600"
                            : task.priority === "HIGH"
                            ? "border-amber-300 text-amber-600"
                            : task.priority === "MEDIUM"
                            ? "border-blue-300 text-blue-600"
                            : "border-slate-300 text-slate-500"
                        }`}
                      >
                        {PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label ?? task.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.label ?? task.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
