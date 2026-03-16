import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет").optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
