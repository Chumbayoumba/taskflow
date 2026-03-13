import { create } from "zustand";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/lib/constants";
import { TASK_STATUSES } from "@/lib/constants";

interface KanbanStore {
  columns: Record<string, TaskWithRelations[]>;
  isLoading: boolean;

  setTasks: (tasks: TaskWithRelations[]) => void;
  setLoading: (loading: boolean) => void;

  moveTask: (
    taskId: string,
    fromStatus: string,
    toStatus: string,
    newIndex: number
  ) => void;

  addTask: (task: TaskWithRelations) => void;
  updateTask: (taskId: string, data: Partial<TaskWithRelations>) => void;
  removeTask: (taskId: string) => void;
}

export const useKanbanStore = create<KanbanStore>((set) => ({
  columns: Object.fromEntries(TASK_STATUSES.map((s) => [s, []])),
  isLoading: true,

  setTasks: (tasks) => {
    const columns: Record<string, TaskWithRelations[]> = {};
    for (const status of TASK_STATUSES) {
      columns[status] = tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.order - b.order);
    }
    set({ columns, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  moveTask: (taskId, fromStatus, toStatus, newIndex) => {
    set((state) => {
      const columns = { ...state.columns };

      // Remove from source column
      const sourceCol = [...(columns[fromStatus] || [])];
      const taskIndex = sourceCol.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return state;

      const [task] = sourceCol.splice(taskIndex, 1);
      columns[fromStatus] = sourceCol;

      // Add to target column
      const targetCol = [...(columns[toStatus] || [])];
      const updatedTask = { ...task, status: toStatus as TaskStatus, order: newIndex };
      targetCol.splice(newIndex, 0, updatedTask);

      // Update orders
      columns[toStatus] = targetCol.map((t, i) => ({ ...t, order: i }));

      return { columns };
    });
  },

  addTask: (task) => {
    set((state) => {
      const columns = { ...state.columns };
      columns[task.status] = [...(columns[task.status] || []), task];
      return { columns };
    });
  },

  updateTask: (taskId, data) => {
    set((state) => {
      const columns = { ...state.columns };
      for (const status of TASK_STATUSES) {
        columns[status] = (columns[status] || []).map((t) =>
          t.id === taskId ? { ...t, ...data } : t
        );
      }
      return { columns };
    });
  },

  removeTask: (taskId) => {
    set((state) => {
      const columns = { ...state.columns };
      for (const status of TASK_STATUSES) {
        columns[status] = (columns[status] || []).filter(
          (t) => t.id !== taskId
        );
      }
      return { columns };
    });
  },
}));
