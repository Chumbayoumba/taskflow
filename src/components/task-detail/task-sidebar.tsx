"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar,
  User,
  Flag,
  CircleDot,
  Clock,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { updateTask } from "@/actions/tasks";
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";
import type { TaskWithDetails } from "@/types";

interface TaskSidebarProps {
  task: TaskWithDetails;
  members: { id: string; name: string; email: string; avatarUrl: string | null }[];
  projectId: string;
}

export function TaskSidebar({ task, members, projectId }: TaskSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (field: string, value: string | null) => {
    if (!value) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", task.id);
      formData.append("projectId", projectId);
      formData.append(field, value);
      await updateTask(task.id, formData);
      router.refresh();
    });
  };

  const assignee = members.find((m) => m.id === task.assigneeId);
  const creator = task.creator;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Детали</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CircleDot className="h-3.5 w-3.5" />
            Статус
          </Label>
          <Select
            value={task.status}
            onValueChange={(value) => handleUpdate("status", value)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_STATUS_MAP).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            Приоритет
          </Label>
          <Select
            value={task.priority}
            onValueChange={(value) => handleUpdate("priority", value)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITY_MAP).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Исполнитель
          </Label>
          <Select
            value={task.assigneeId || "unassigned"}
            onValueChange={(value) =>
              handleUpdate("assigneeId", value === "unassigned" ? "" : value)
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Не назначен</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Дедлайн
          </Label>
          <Input
            type="date"
            value={task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : ""}
            onChange={(e) => handleUpdate("deadline", e.target.value)}
            disabled={isPending}
            className="h-9"
          />
        </div>

        {/* Divider */}
        <div className="border-t pt-4 space-y-3">
          {/* Creator */}
          {creator && (
            <div className="flex items-center gap-2 text-sm">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Создатель:</span>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {creator.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{creator.name}</span>
              </div>
            </div>
          )}

          {/* Assignee display */}
          {assignee && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Исполнитель:</span>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {assignee.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{assignee.name}</span>
              </div>
            </div>
          )}

          {/* Created date */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Создана:</span>
            <span>{format(new Date(task.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}</span>
          </div>

          {/* Updated date */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Обновлена:</span>
            <span>{format(new Date(task.updatedAt), "d MMM yyyy, HH:mm", { locale: ru })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
