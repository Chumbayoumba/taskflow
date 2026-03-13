"use client";

import { useEffect, useState, useCallback } from "react";
import { useKanbanStore } from "@/store/kanban-store";
import { getProjectTasks, moveTask } from "@/actions/tasks";
import { Column } from "./column";
import { TaskDialog } from "./task-dialog";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { TaskWithRelations } from "@/types";

interface BoardProps {
  projectId: string;
  members: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
}

export function Board({ projectId, members }: BoardProps) {
  const { columns, setTasks, isLoading, moveTask: optimisticMove } =
    useKanbanStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(
    null
  );

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedFromStatus, setDraggedFromStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    getProjectTasks(projectId).then(setTasks);
  }, [projectId, setTasks]);

  const handleDragStart = useCallback(
    (taskId: string, fromStatus: string) => {
      setDraggedTaskId(taskId);
      setDraggedFromStatus(fromStatus);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    async (targetStatus: string) => {
      if (!draggedTaskId || !draggedFromStatus) return;
      if (draggedFromStatus === targetStatus) {
        setDraggedTaskId(null);
        setDraggedFromStatus(null);
        return;
      }

      const targetColumn = columns[targetStatus] || [];
      const newIndex = targetColumn.length;

      // Optimistic update
      optimisticMove(draggedTaskId, draggedFromStatus, targetStatus, newIndex);

      // Server action
      const result = await moveTask(
        draggedTaskId,
        targetStatus as TaskStatus,
        newIndex
      );

      // Revert on failure
      if (!result.success) {
        optimisticMove(draggedTaskId, targetStatus, draggedFromStatus, 0);
      }

      setDraggedTaskId(null);
      setDraggedFromStatus(null);
    },
    [draggedTaskId, draggedFromStatus, columns, optimisticMove]
  );

  const handleTaskClick = useCallback((task: TaskWithRelations) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Kanban Board</h2>
        <Button
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status] || []}
            isDragOver={false}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
            onTaskClick={handleTaskClick}
            onNewTask={() => {
              setEditingTask(null);
              setDialogOpen(true);
            }}
          />
        ))}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        projectId={projectId}
        members={members}
        task={editingTask ?? undefined}
      />
    </div>
  );
}
