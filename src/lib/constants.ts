export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const MEMBER_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "DEADLINE_WARNING",
  "DEADLINE_OVERDUE",
  "TASK_STATUS_CHANGED",
  "PROJECT_INVITED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string; textColor: string; icon: string }
> = {
  TODO: { label: "To Do", color: "#94a3b8", bgColor: "bg-slate-100", textColor: "text-slate-600", icon: "Circle" },
  IN_PROGRESS: { label: "In Progress", color: "#0ea5e9", bgColor: "bg-sky-100", textColor: "text-sky-600", icon: "PlayCircle" },
  REVIEW: { label: "Review", color: "#8b5cf6", bgColor: "bg-violet-100", textColor: "text-violet-600", icon: "Eye" },
  DONE: { label: "Done", color: "#10b981", bgColor: "bg-emerald-100", textColor: "text-emerald-600", icon: "CheckCircle2" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  LOW: { label: "Low", color: "#94a3b8", bgColor: "bg-slate-100", textColor: "text-slate-600" },
  MEDIUM: { label: "Medium", color: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  HIGH: { label: "High", color: "#f59e0b", bgColor: "bg-amber-100", textColor: "text-amber-600" },
  URGENT: { label: "Urgent", color: "#f43f5e", bgColor: "bg-rose-100", textColor: "text-rose-600" },
};

export const PROJECT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6b7280", // gray
];
