"use client";

import { useState } from "react";
import { STATUS_CONFIG, type TaskStatus } from "@/lib/constants";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import {
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
};

const HEADER_COLORS: Record<string, string> = {
  slate: "bg-slate-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
};

const ICON_COLORS: Record<string, string> = {
  slate: "text-slate-500",
  sky: "text-sky-500",
  violet: "text-violet-500",
  emerald: "text-emerald-500",
};

const DROP_ZONE_COLORS: Record<string, string> = {
  slate: "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30",
  sky: "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-900/30",
  violet: "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/30",
  emerald: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30",
};

interface ColumnProps {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  isDragOver: boolean;
  onDragStart: (taskId: string, fromStatus: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onTaskClick: (task: TaskWithRelations) => void;
  onNewTask: () => void;
}

export function Column({
  status,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  onTaskClick,
  onNewTask,
}: ColumnProps) {
  const config = STATUS_CONFIG[status];
  const Icon = ICON_MAP[config.icon] ?? Circle;
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-muted/30 min-h-[400px] transition-colors",
        isOver && DROP_ZONE_COLORS[config.color]
      )}
      onDragOver={(e) => {
        onDragOver(e);
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => {
        setIsOver(false);
        onDrop();
      }}
    >
      {/* Colored header bar */}
      <div className={cn("h-1.5 rounded-t-xl", HEADER_COLORS[config.color])} />

      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", ICON_COLORS[config.color])} />
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewTask}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Task list */}
      <div className="flex-1 px-2 pb-2 space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={() => onDragStart(task.id, status)}
            onClick={() => onTaskClick(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
