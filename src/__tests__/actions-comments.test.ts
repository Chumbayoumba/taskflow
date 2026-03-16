/**
 * AUDIT TEST SUITE: Comment Actions
 * Tests createComment, updateComment, deleteComment with mocked prisma + auth
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    task: { findUnique: vi.fn() },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    notification: { create: vi.fn() },
    taskActivity: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/actions/activity", () => ({ logActivity: vi.fn() }));

// ─── Import AFTER mocks ───
import { createComment, updateComment, deleteComment, getTaskComments } from "@/actions/comments";

// ─── Helpers ───
function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function resetAll() {
  vi.clearAllMocks();
}

// ─── Tests ───
describe("createComment", () => {
  beforeEach(resetAll);

  it("returns error if user not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createComment("task-1", "Hello")).rejects.toThrow("Unauthorized");
  });

  it("returns error for empty content", async () => {
    loginAs("user-1");
    const result = await createComment("task-1", "");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });

  it("returns error if task not found", async () => {
    loginAs("user-1");
    mockPrisma.task.findUnique.mockResolvedValue(null);
    const result = await createComment("task-nonexistent", "Hello");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найдена");
  });

  it("creates comment successfully", async () => {
    loginAs("user-1");
    mockPrisma.task.findUnique.mockResolvedValue({
      projectId: "proj-1",
      title: "Test Task",
      assigneeId: "user-2",
      creatorId: "user-3",
    });
    mockPrisma.comment.create.mockResolvedValue({ id: "comment-1" });

    const result = await createComment("task-1", "Great work!");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("comment-1");
    }
    expect(mockPrisma.comment.create).toHaveBeenCalledWith({
      data: {
        content: "Great work!",
        taskId: "task-1",
        authorId: "user-1",
      },
    });
  });

  it("notifies assignee and creator (not self)", async () => {
    loginAs("user-1");
    mockPrisma.task.findUnique.mockResolvedValue({
      projectId: "proj-1",
      title: "Test Task",
      assigneeId: "user-2",
      creatorId: "user-3",
    });
    mockPrisma.comment.create.mockResolvedValue({ id: "comment-1" });

    await createComment("task-1", "Hello!");
    // Should notify user-2 (assignee) and user-3 (creator)
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it("does not notify self if author is assignee", async () => {
    loginAs("user-1");
    mockPrisma.task.findUnique.mockResolvedValue({
      projectId: "proj-1",
      title: "Test",
      assigneeId: "user-1", // same as author
      creatorId: "user-2",
    });
    mockPrisma.comment.create.mockResolvedValue({ id: "c-1" });

    await createComment("task-1", "Note to self");
    // Only user-2 (creator) notified
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
  });
});

describe("updateComment", () => {
  beforeEach(resetAll);

  it("returns error for empty content", async () => {
    loginAs("user-1");
    const result = await updateComment("comment-1", "");
    expect(result.success).toBe(false);
  });

  it("returns error if comment not found", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue(null);
    const result = await updateComment("comment-nope", "updated");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найден");
  });

  it("returns error if not the author", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue({
      authorId: "user-2",
      task: { projectId: "p", id: "t" },
    });
    const result = await updateComment("comment-1", "hacked");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("прав");
  });

  it("updates comment successfully", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue({
      authorId: "user-1",
      task: { projectId: "proj-1", id: "task-1" },
    });
    mockPrisma.comment.update.mockResolvedValue({});

    const result = await updateComment("comment-1", "Updated text");
    expect(result.success).toBe(true);
    expect(mockPrisma.comment.update).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      data: { content: "Updated text" },
    });
  });
});

describe("deleteComment", () => {
  beforeEach(resetAll);

  it("returns error if comment not found", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue(null);
    const result = await deleteComment("nope");
    expect(result.success).toBe(false);
  });

  it("returns error if not the author", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue({
      authorId: "user-other",
      task: { projectId: "p", id: "t" },
    });
    const result = await deleteComment("comment-1");
    expect(result.success).toBe(false);
  });

  it("deletes comment successfully", async () => {
    loginAs("user-1");
    mockPrisma.comment.findUnique.mockResolvedValue({
      authorId: "user-1",
      task: { projectId: "p", id: "t" },
    });
    mockPrisma.comment.delete.mockResolvedValue({});

    const result = await deleteComment("comment-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.comment.delete).toHaveBeenCalled();
  });
});

describe("getTaskComments", () => {
  beforeEach(resetAll);

  it("returns comments from prisma", async () => {
    const mockComments = [
      { id: "c1", content: "Hello", author: { id: "u1", name: "Alice" } },
    ];
    mockPrisma.comment.findMany.mockResolvedValue(mockComments);

    const result = await getTaskComments("task-1");
    expect(result).toEqual(mockComments);
    expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
      where: { taskId: "task-1" },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  });
});
