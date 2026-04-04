"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKanbanStore } from "@/store/kanban-store";
import { getProjectTasksForBoard, moveTask } from "@/actions/tasks";
import { getProjectTags } from "@/actions/tags";
import { Column } from "./column";
import { TaskDialog } from "./task-dialog";
import { BoardFiltersBar } from "./board-filters";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { VoiceTaskDialog } from "./voice-task-dialog";
import type { TaskWithRelations } from "@/types";

interface BoardProps {
  projectId: string;
  members: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  tags?: { id: string; name: string; color: string }[];
}

export function Board({ projectId, members, tags }: BoardProps) {
  const router = useRouter();
  const { columns, setTasks, isLoading, moveTask: optimisticMove, filters, setFilters, getFilteredColumns } =
    useKanbanStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [projectTags, setProjectTags] = useState<{ id: string; name: string; color: string }[]>(tags ?? []);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedFromStatus, setDraggedFromStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    getProjectTasksForBoard(projectId).then((tasks) =>
      setTasks(tasks as unknown as TaskWithRelations[])
    );
    if (!tags) {
      getProjectTags(projectId).then(setProjectTags);
    }
  }, [projectId, setTasks, tags]);

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
    router.push(`/projects/${projectId}/tasks/${task.id}`);
  }, [router, projectId]);

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredColumns = getFilteredColumns();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Канбан-доска</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setVoiceDialogOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950/50"
          >
            <Sparkles className="h-4 w-4" />
            AI задачи
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Новая задача
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <BoardFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          members={members}
          tags={projectTags}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={filteredColumns[status] || []}
            isDragOver={false}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
            onTaskClick={handleTaskClick}
            onNewTask={() => setDialogOpen(true)}
          />
        ))}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        projectId={projectId}
        members={members}
      />

      <VoiceTaskDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
