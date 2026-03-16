import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, AlertTriangle, UserPlus, MessageSquare, Link } from "lucide-react";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      task: {
        select: {
          title: true,
          projectId: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  const typeIcons: Record<string, typeof Bell> = {
    TASK_ASSIGNED: UserPlus,
    DEADLINE_WARNING: AlertTriangle,
    DEADLINE_OVERDUE: AlertTriangle,
    TASK_STATUS_CHANGED: CheckCircle2,
    PROJECT_INVITED: UserPlus,
    COMMENT_ADDED: MessageSquare,
    DEPENDENCY_ADDED: Link,
  };

  const typeColors: Record<string, string> = {
    TASK_ASSIGNED: "text-blue-600 bg-blue-50",
    DEADLINE_WARNING: "text-amber-600 bg-amber-50",
    DEADLINE_OVERDUE: "text-rose-600 bg-rose-50",
    TASK_STATUS_CHANGED: "text-emerald-600 bg-emerald-50",
    PROJECT_INVITED: "text-indigo-600 bg-indigo-50",
    COMMENT_ADDED: "text-sky-600 bg-sky-50",
    DEPENDENCY_ADDED: "text-violet-600 bg-violet-50",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Уведомления</h1>
        <Badge variant="secondary">{notifications.length}</Badge>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              Нет уведомлений
            </h3>
            <p className="text-slate-500">
              Здесь будут появляться уведомления о задачах и проектах
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((n) => {
                const IconComponent = typeIcons[n.type] ?? Bell;
                const colorClass = typeColors[n.type] ?? "text-slate-600 bg-slate-50";
                const [textColor, bgColor] = colorClass.split(" ");

                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-4 ${
                      !n.read ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${bgColor} flex-shrink-0`}>
                      <IconComponent className={`h-4 w-4 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{n.message}</p>
                      {n.task && (
                        <p className="text-xs text-slate-400 mt-1">
                          {n.task.project.name} — {n.task.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
