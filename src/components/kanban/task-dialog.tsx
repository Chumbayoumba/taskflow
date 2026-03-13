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
  SelectValue,
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
import { Loader2, Trash2 } from "lucide-react";
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

  // Format deadline for date input (YYYY-MM-DD)
  const deadlineDefault = task?.deadline
    ? new Date(task.deadline).toISOString().split("T")[0]
    : "";

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
          // Refetch to get the full task with relations
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
          <DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Task title"
              defaultValue={task?.title ?? ""}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the task..."
              rows={3}
              defaultValue={task?.description ?? ""}
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                name="priority"
                defaultValue={task?.priority ?? "MEDIUM"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                name="assigneeId"
                defaultValue={task?.assigneeId ?? "unassigned"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={deadlineDefault}
            />
          </div>

          {/* Actions */}
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
                Delete
              </Button>
            )}

            {showDeleteConfirm && (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-sm text-destructive">Are you sure?</span>
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
                    "Confirm"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
