/**
 * AUDIT TEST SUITE: Dependency Actions
 * Tests addDependency, removeDependency, getTaskDependencies
 * Verifies cycle detection, cross-project check, duplicate check, self-reference
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    task: { findUnique: vi.fn() },
    taskDependency: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    notification: { create: vi.fn() },
    taskActivity: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/actions/activity", () => ({ logActivity: vi.fn() }));

import { addDependency, removeDependency, getTaskDependencies } from "@/actions/dependencies";

function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("addDependency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(addDependency("t1", "t2")).rejects.toThrow("Unauthorized");
  });

  it("rejects self-dependency", async () => {
    loginAs("u1");
    const result = await addDependency("t1", "t1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("самой себя");
  });

  it("rejects empty dependsOnId", async () => {
    loginAs("u1");
    const result = await addDependency("t1", "");
    expect(result.success).toBe(false);
  });

  it("returns error if task not found", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue(null);
    const result = await addDependency("t1", "t2");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найдена");
  });

  it("rejects cross-project dependency", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "proj-1", title: "T1", assigneeId: null })
      .mockResolvedValueOnce({ projectId: "proj-2", title: "T2", assigneeId: null });
    const result = await addDependency("t1", "t2");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("одном проекте");
  });

  it("rejects duplicate dependency", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "p1", title: "T1", assigneeId: null })
      .mockResolvedValueOnce({ projectId: "p1", title: "T2", assigneeId: null });
    // No cycles
    mockPrisma.taskDependency.findMany.mockResolvedValue([]);
    // Already exists
    mockPrisma.taskDependency.findUnique.mockResolvedValue({ id: "dep-1" });

    const result = await addDependency("t1", "t2");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("уже существует");
  });

  it("detects cyclic dependency (A→B, B→A)", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "p1", title: "A", assigneeId: null })
      .mockResolvedValueOnce({ projectId: "p1", title: "B", assigneeId: null });
    // hasCyclicDependency: check B's dependencies — B depends on A (cycle!)
    mockPrisma.taskDependency.findMany.mockResolvedValue([
      { dependsOnId: "t1" }, // B already depends on t1 (A)
    ]);

    const result = await addDependency("t1", "t2");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Циклическая");
  });

  it("creates dependency successfully", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "p1", title: "A", assigneeId: null })
      .mockResolvedValueOnce({ projectId: "p1", title: "B", assigneeId: null });
    mockPrisma.taskDependency.findMany.mockResolvedValue([]);
    mockPrisma.taskDependency.findUnique.mockResolvedValue(null);
    mockPrisma.taskDependency.create.mockResolvedValue({});

    const result = await addDependency("t1", "t2");
    expect(result.success).toBe(true);
    expect(mockPrisma.taskDependency.create).toHaveBeenCalledWith({
      data: { taskId: "t1", dependsOnId: "t2" },
    });
  });

  it("notifies assignee when dependency added", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "p1", title: "A", assigneeId: "u2" })
      .mockResolvedValueOnce({ projectId: "p1", title: "B", assigneeId: null });
    mockPrisma.taskDependency.findMany.mockResolvedValue([]);
    mockPrisma.taskDependency.findUnique.mockResolvedValue(null);
    mockPrisma.taskDependency.create.mockResolvedValue({});

    await addDependency("t1", "t2");
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("does not notify if author is assignee", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique
      .mockResolvedValueOnce({ projectId: "p1", title: "A", assigneeId: "u1" })
      .mockResolvedValueOnce({ projectId: "p1", title: "B", assigneeId: null });
    mockPrisma.taskDependency.findMany.mockResolvedValue([]);
    mockPrisma.taskDependency.findUnique.mockResolvedValue(null);
    mockPrisma.taskDependency.create.mockResolvedValue({});

    await addDependency("t1", "t2");
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });
});

describe("removeDependency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if dependency not found", async () => {
    loginAs("u1");
    mockPrisma.taskDependency.findUnique.mockResolvedValue(null);
    const result = await removeDependency("t1", "t2");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найдена");
  });

  it("removes dependency successfully", async () => {
    loginAs("u1");
    mockPrisma.taskDependency.findUnique.mockResolvedValue({
      dependsOn: { title: "Task B" },
      task: { projectId: "p1" },
    });
    mockPrisma.taskDependency.delete.mockResolvedValue({});

    const result = await removeDependency("t1", "t2");
    expect(result.success).toBe(true);
    expect(mockPrisma.taskDependency.delete).toHaveBeenCalledWith({
      where: { taskId_dependsOnId: { taskId: "t1", dependsOnId: "t2" } },
    });
  });
});

describe("getTaskDependencies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dependencies and dependedOnBy", async () => {
    const deps = [{ dependsOn: { id: "t2", title: "B" } }];
    const revDeps = [{ task: { id: "t3", title: "C" } }];
    mockPrisma.taskDependency.findMany
      .mockResolvedValueOnce(deps)
      .mockResolvedValueOnce(revDeps);

    const result = await getTaskDependencies("t1");
    expect(result.dependencies).toEqual(deps);
    expect(result.dependedOnBy).toEqual(revDeps);
  });
});
