"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  createTask,
  updateTask,
  deleteTask,
} from "@/actions/tasks";
import { useKanbanStore } from "@/store/kanban-store";
import {
  TASK_PRIORITIES,
  PRIORITY_CONFIG,
  type TaskPriority,
} from "@/lib/constants";
import { Loader2, Trash2, User, Flag } from "lucide-react";
import type { TaskWithRelations } from "@/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  task?: TaskWithRelations;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
  task,
}: TaskDialogProps) {
  const isEdit = !!task;
  const { addTask, updateTask: storeUpdate, removeTask } = useKanbanStore();

  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priority, setPriority] = useState<string>(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "unassigned");

  const deadlineDefault = task?.deadline
    ? new Date(task.deadline).toISOString().split("T")[0]
    : "";

  const priorityLabel = PRIORITY_CONFIG[priority as TaskPriority]?.label ?? "Средний";
  const assigneeLabel = assigneeId === "unassigned"
    ? "Не назначен"
    : members.find((m) => m.id === assigneeId)?.name ?? "Назначить...";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      if (isEdit && task) {
        const result = await updateTask(task.id, formData);
        if (result.success) {
          storeUpdate(task.id, {
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || null,
            priority: formData.get("priority") as TaskPriority,
            assigneeId: (formData.get("assigneeId") as string) || null,
            deadline: formData.get("deadline")
              ? new Date(formData.get("deadline") as string)
              : null,
            assignee:
              members.find(
                (m) => m.id === (formData.get("assigneeId") as string)
              ) ?? null,
          });
          onOpenChange(false);
        }
      } else {
        const result = await createTask(projectId, formData);
        if (result.success) {
          const { getProjectTasks } = await import("@/actions/tasks");
          const tasks = await getProjectTasks(projectId);
          const { setTasks } = useKanbanStore.getState();
          setTasks(tasks);
          onOpenChange(false);
        }
      }
    });
  }

  function handleDelete() {
    if (!task) return;

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        removeTask(task.id);
        setShowDeleteConfirm(false);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Редактировать задачу" : "Создать задачу"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные задачи ниже."
              : "Заполните данные для создания новой задачи."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              name="title"
              placeholder="Название задачи"
              defaultValue={task?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Опишите задачу..."
              rows={3}
              defaultValue={task?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <input type="hidden" name="priority" value={priority} />
              <Select
                value={priority}
                onValueChange={(v: string | null) => setPriority(v ?? "MEDIUM")}
              >
                <SelectTrigger>
                  <span className="flex items-center gap-1.5 flex-1 text-left truncate">
                    <Flag className="h-3.5 w-3.5 shrink-0" />
                    {priorityLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} label={PRIORITY_CONFIG[p].label}>
                      {PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <input type="hidden" name="assigneeId" value={assigneeId === "unassigned" ? "" : assigneeId} />
              <Select
                value={assigneeId}
                onValueChange={(v: string | null) => setAssigneeId(v ?? "unassigned")}
              >
                <SelectTrigger>
                  <span className="flex items-center gap-1.5 flex-1 text-left truncate">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {assigneeLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" label="Не назначен">
                    Не назначен
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id} label={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={deadlineDefault}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEdit && !showDeleteConfirm && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            )}

            {showDeleteConfirm && (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-sm text-destructive">Вы уверены?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Да"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                >
                  Нет
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
