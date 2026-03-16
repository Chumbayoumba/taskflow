"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateTask, deleteTask } from "@/actions/tasks";
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";
import type { TaskWithDetails } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-green-100 text-green-700",
};

interface TaskHeaderProps {
  task: TaskWithDetails;
  projectId: string;
  projectName: string;
}

export function TaskHeader({ task, projectId, projectName }: TaskHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isPending, startTransition] = useTransition();

  const handleSaveTitle = () => {
    if (!title.trim() || title === task.title) {
      setTitle(task.title);
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", task.id);
      formData.append("title", title.trim());
      formData.append("projectId", projectId);
      await updateTask(task.id, formData);
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTask(task.id);
      router.push(`/projects/${projectId}/board`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-2"
          onClick={() => router.push(`/projects/${projectId}/board`)}
        >
          <ArrowLeft className="h-4 w-4" />
          {projectName}
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">Задача</span>
      </div>

      {/* Title + badges + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setTitle(task.title);
                    setIsEditing(false);
                  }
                }}
              />
              <Button size="icon" variant="ghost" onClick={handleSaveTitle} disabled={isPending}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setTitle(task.title);
                  setIsEditing(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </h1>
          )}

          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[task.status] || ""}>
              {TASK_STATUS_MAP[task.status] || task.status}
            </Badge>
            <Badge className={PRIORITY_COLORS[task.priority] || ""}>
              {TASK_PRIORITY_MAP[task.priority] || task.priority}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Редактировать
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Задача и все связанные данные будут удалены навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
