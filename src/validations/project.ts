import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет").default("#6366f1"),
});

export const updateProjectSchema = createProjectSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Введите корректный email"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
