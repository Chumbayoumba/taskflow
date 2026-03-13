import { z } from "zod";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  assigneeId: z.string().optional(),
  deadline: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(TASK_STATUSES).optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string(),
  newStatus: z.enum(TASK_STATUSES),
  newOrder: z.number().int().min(0),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
