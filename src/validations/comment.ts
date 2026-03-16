import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Комментарий не может быть пустым").max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Комментарий не может быть пустым").max(5000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
