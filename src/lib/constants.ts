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
  { label: string; color: string; hex: string; bgColor: string; textColor: string; icon: string }
> = {
  TODO: { label: "К выполнению", color: "slate", hex: "#94a3b8", bgColor: "bg-slate-100", textColor: "text-slate-600", icon: "Circle" },
  IN_PROGRESS: { label: "В работе", color: "sky", hex: "#0ea5e9", bgColor: "bg-sky-100", textColor: "text-sky-600", icon: "PlayCircle" },
  REVIEW: { label: "На проверке", color: "violet", hex: "#8b5cf6", bgColor: "bg-violet-100", textColor: "text-violet-600", icon: "Eye" },
  DONE: { label: "Готово", color: "emerald", hex: "#10b981", bgColor: "bg-emerald-100", textColor: "text-emerald-600", icon: "CheckCircle2" },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; hex: string; bgColor: string; textColor: string }
> = {
  LOW: { label: "Низкий", color: "slate", hex: "#94a3b8", bgColor: "bg-slate-100", textColor: "text-slate-600" },
  MEDIUM: { label: "Средний", color: "blue", hex: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  HIGH: { label: "Высокий", color: "amber", hex: "#f59e0b", bgColor: "bg-amber-100", textColor: "text-amber-600" },
  URGENT: { label: "Критичный", color: "rose", hex: "#f43f5e", bgColor: "bg-rose-100", textColor: "text-rose-600" },
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

export const ACTIVITY_ACTIONS = [
  "CREATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "PRIORITY_CHANGED",
  "COMMENT_ADDED",
  "COMMENT_DELETED",
  "CHECKLIST_ITEM_ADDED",
  "CHECKLIST_ITEM_TOGGLED",
  "CHECKLIST_ITEM_DELETED",
  "TAG_ADDED",
  "TAG_REMOVED",
  "DEPENDENCY_ADDED",
  "DEPENDENCY_REMOVED",
  "TITLE_CHANGED",
  "DESCRIPTION_CHANGED",
  "DEADLINE_CHANGED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: "создал(а) задачу",
  STATUS_CHANGED: "изменил(а) статус",
  ASSIGNED: "назначил(а) исполнителя",
  PRIORITY_CHANGED: "изменил(а) приоритет",
  COMMENT_ADDED: "добавил(а) комментарий",
  COMMENT_DELETED: "удалил(а) комментарий",
  CHECKLIST_ITEM_ADDED: "добавил(а) пункт чеклиста",
  CHECKLIST_ITEM_TOGGLED: "обновил(а) пункт чеклиста",
  CHECKLIST_ITEM_DELETED: "удалил(а) пункт чеклиста",
  TAG_ADDED: "добавил(а) тег",
  TAG_REMOVED: "удалил(а) тег",
  DEPENDENCY_ADDED: "добавил(а) зависимость",
  DEPENDENCY_REMOVED: "удалил(а) зависимость",
  TITLE_CHANGED: "изменил(а) название",
  DESCRIPTION_CHANGED: "изменил(а) описание",
  DEADLINE_CHANGED: "изменил(а) дедлайн",
};

export const DEFAULT_TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
  "#14b8a6", // teal
];

export const TASK_STATUS_MAP: Record<string, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Готово",
};

export const TASK_PRIORITY_MAP: Record<string, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Критичный",
};

export const FILTER_DEADLINE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "overdue", label: "Просрочено" },
  { value: "today", label: "Сегодня" },
  { value: "this_week", label: "Эта неделя" },
  { value: "no_deadline", label: "Без дедлайна" },
] as const;
