import { create } from "zustand";
import type { TaskWithRelations, BoardFilters } from "@/types";
import type { TaskStatus } from "@/lib/constants";
import { TASK_STATUSES } from "@/lib/constants";

const DEFAULT_FILTERS: BoardFilters = {
  assigneeIds: [],
  priorities: [],
  tagIds: [],
  deadlineFilter: "all",
};

interface KanbanStore {
  columns: Record<string, TaskWithRelations[]>;
  isLoading: boolean;
  filters: BoardFilters;

  setTasks: (tasks: TaskWithRelations[]) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: BoardFilters) => void;
  getFilteredColumns: () => Record<string, TaskWithRelations[]>;

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

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  columns: Object.fromEntries(TASK_STATUSES.map((s) => [s, []])),
  isLoading: true,
  filters: DEFAULT_FILTERS,

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

  setFilters: (filters) => set({ filters }),

  getFilteredColumns: () => {
    const { columns, filters } = get();
    const hasFilters =
      filters.assigneeIds.length > 0 ||
      filters.priorities.length > 0 ||
      filters.tagIds.length > 0 ||
      filters.deadlineFilter !== "all";

    if (!hasFilters) return columns;

    const filtered: Record<string, TaskWithRelations[]> = {};
    for (const status of TASK_STATUSES) {
      filtered[status] = (columns[status] || []).filter((task) => {
        if (
          filters.assigneeIds.length > 0 &&
          (!task.assigneeId || !filters.assigneeIds.includes(task.assigneeId))
        )
          return false;

        if (
          filters.priorities.length > 0 &&
          !filters.priorities.includes(task.priority)
        )
          return false;

        if (filters.tagIds.length > 0) {
          const taskWithTags = task as TaskWithRelations & { taskTags?: { tagId: string }[] };
          const hasMatchingTag = taskWithTags.taskTags?.some((tt) =>
            filters.tagIds.includes(tt.tagId)
          );
          if (!hasMatchingTag) return false;
        }

        if (filters.deadlineFilter !== "all") {
          const now = new Date();
          const deadline = task.deadline ? new Date(task.deadline) : null;

          switch (filters.deadlineFilter) {
            case "overdue":
              if (!deadline || deadline >= now) return false;
              break;
            case "today": {
              if (!deadline) return false;
              const todayStr = now.toISOString().slice(0, 10);
              if (deadline.toISOString().slice(0, 10) !== todayStr) return false;
              break;
            }
            case "this_week": {
              if (!deadline) return false;
              const weekFromNow = new Date(now);
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              if (deadline > weekFromNow) return false;
              break;
            }
            case "no_deadline":
              if (deadline) return false;
              break;
          }
        }

        return true;
      });
    }
    return filtered;
  },

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
