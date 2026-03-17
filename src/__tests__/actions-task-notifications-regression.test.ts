import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    projectMember: { findFirst: vi.fn() },
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/actions/activity", () => ({ logActivity: vi.fn() }));

import { getUnreadCount } from "@/actions/notifications";
import { moveTask } from "@/actions/tasks";

function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("notification regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.projectMember.findFirst.mockResolvedValue({ id: "member-1" });
    mockPrisma.notification.count.mockResolvedValue(0);
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    mockPrisma.task.findMany.mockResolvedValue([]);
  });

  it("keeps owner/self-assignee in recipients when moving own task", async () => {
    loginAs("owner-1");
    mockPrisma.task.findUnique.mockResolvedValue({
      projectId: "project-1",
      status: "IN_PROGRESS",
      assigneeId: "owner-1",
      title: "Critical task",
      creatorId: "owner-1",
      project: {
        ownerId: "owner-1",
        members: [],
      },
    });
    mockPrisma.task.update.mockResolvedValue({});

    const result = await moveTask("task-1", "DONE", 0);

    expect(result.success).toBe(true);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        type: "TASK_STATUS_CHANGED",
        message: 'Задача "Critical task" → DONE',
        userId: "owner-1",
        taskId: "task-1",
      },
    });
  });

  it("generates deadline warnings during unread-count polling path", async () => {
    loginAs("user-1");
    mockPrisma.notification.count.mockResolvedValue(3);
    mockPrisma.task.findMany
      .mockResolvedValueOnce([
        {
          id: "task-24h",
          title: "Deadline soon",
          assigneeId: "user-1",
          creatorId: "creator-1",
          project: {
            ownerId: "owner-1",
            members: [{ userId: "admin-1" }],
          },
        },
      ])
      .mockResolvedValueOnce([]);

    const count = await getUnreadCount();

    expect(count).toBe(3);
    expect(mockPrisma.task.findMany).toHaveBeenCalledTimes(2);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        type: "DEADLINE_WARNING",
        message: 'Дедлайн задачи "Deadline soon" через менее 24 часов',
        userId: "user-1",
        taskId: "task-24h",
      },
    });
  });
});
