import { z } from "zod";

export const addDependencySchema = z.object({
  dependsOnId: z.string().min(1, "Выберите задачу"),
});

export type AddDependencyInput = z.infer<typeof addDependencySchema>;
