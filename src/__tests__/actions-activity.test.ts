/**
 * AUDIT TEST SUITE: Activity Actions
 * Tests logActivity helper and getTaskActivity
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    taskActivity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { logActivity, getTaskActivity } from "@/actions/activity";

function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("logActivity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates activity record with all fields", async () => {
    mockPrisma.taskActivity.create.mockResolvedValue({});
    await logActivity("t1", "u1", "STATUS_CHANGED", "TODO", "IN_PROGRESS");

    expect(mockPrisma.taskActivity.create).toHaveBeenCalledWith({
      data: {
        taskId: "t1",
        userId: "u1",
        action: "STATUS_CHANGED",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
      },
    });
  });

  it("handles null values correctly", async () => {
    mockPrisma.taskActivity.create.mockResolvedValue({});
    await logActivity("t1", "u1", "CREATED", null, null);

    expect(mockPrisma.taskActivity.create).toHaveBeenCalledWith({
      data: {
        taskId: "t1",
        userId: "u1",
        action: "CREATED",
        oldValue: null,
        newValue: null,
      },
    });
  });

  it("handles undefined values (converts to null)", async () => {
    mockPrisma.taskActivity.create.mockResolvedValue({});
    await logActivity("t1", "u1", "TAG_ADDED", undefined, "Bug");

    expect(mockPrisma.taskActivity.create).toHaveBeenCalledWith({
      data: {
        taskId: "t1",
        userId: "u1",
        action: "TAG_ADDED",
        oldValue: null,
        newValue: "Bug",
      },
    });
  });
});

describe("getTaskActivity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getTaskActivity("t1")).rejects.toThrow("Unauthorized");
  });

  it("returns activities with user info, sorted desc", async () => {
    loginAs("u1");
    const activities = [
      { id: "a1", action: "CREATED", user: { id: "u1", name: "Alice" } },
    ];
    mockPrisma.taskActivity.findMany.mockResolvedValue(activities);

    const result = await getTaskActivity("t1");
    expect(result).toEqual(activities);
    expect(mockPrisma.taskActivity.findMany).toHaveBeenCalledWith({
      where: { taskId: "t1" },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
