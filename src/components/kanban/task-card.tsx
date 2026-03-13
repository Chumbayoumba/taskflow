"use client";

import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { PRIORITY_CONFIG, type TaskPriority } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical, Calendar, AlertCircle, Flame, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  amber:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

const PRIORITY_LEFT_BORDER: Record<string, string> = {
  slate: "border-l-slate-300 dark:border-l-slate-600",
  blue: "border-l-blue-400 dark:border-l-blue-500",
  amber: "border-l-amber-400 dark:border-l-amber-500",
  rose: "border-l-rose-500 dark:border-l-rose-400",
};

const PRIORITY_ICONS: Record<string, React.ElementType> = {
  slate: ArrowDown,
  blue: Minus,
  amber: ArrowUp,
  rose: Flame,
};

function getDeadlineInfo(deadline: string | Date | null) {
  if (!deadline) return null;

  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let colorClass: string;
  if (diffDays < 0) {
    colorClass = "text-red-600 dark:text-red-400";
  } else if (diffDays <= 3) {
    colorClass = "text-amber-600 dark:text-amber-400";
  } else {
    colorClass = "text-emerald-600 dark:text-emerald-400";
  }

  const label = formatDistanceToNow(date, { addSuffix: true, locale: ru });

  return { label, colorClass, isOverdue: diffDays < 0 };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface TaskCardProps {
  task: TaskWithRelations;
  onDragStart: () => void;
  onClick: () => void;
}

export function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority];
  const deadline = getDeadlineInfo(task.deadline);
  const PriorityIcon = priorityConfig ? PRIORITY_ICONS[priorityConfig.color] : null;

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onClick={onClick}
      className={cn(
        "cursor-pointer border-l-[3px] transition-all duration-200 group",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:shadow-sm active:translate-y-0",
        "bg-card",
        priorityConfig ? PRIORITY_LEFT_BORDER[priorityConfig.color] : "border-l-transparent"
      )}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Drag handle + Title */}
        <div className="flex items-start gap-1.5">
          <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
          <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">
            {task.title}
          </p>
        </div>

        {/* Priority badge */}
        {priorityConfig && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 font-medium gap-1",
              PRIORITY_BADGE_STYLES[priorityConfig.color]
            )}
          >
            {PriorityIcon && <PriorityIcon className="h-2.5 w-2.5" />}
            {priorityConfig.label}
          </Badge>
        )}

        {/* Footer: assignee + deadline */}
        <div className="flex items-center justify-between pt-1">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Deadline */}
          {deadline && (
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium",
                deadline.colorClass
              )}
            >
              {deadline.isOverdue ? (
                <AlertCircle className="h-3 w-3 animate-pulse" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>{deadline.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
