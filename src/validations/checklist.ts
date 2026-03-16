import { z } from "zod";

export const addChecklistItemSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500).optional(),
  completed: z.boolean().optional(),
});

export type AddChecklistItemInput = z.infer<typeof addChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
