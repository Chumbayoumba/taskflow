/**
 * AUDIT TEST SUITE: Checklist Actions
 * Tests addChecklistItem, toggleChecklistItem, updateChecklistItem, deleteChecklistItem
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    task: { findUnique: vi.fn() },
    checklistItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    taskActivity: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/actions/activity", () => ({ logActivity: vi.fn() }));

import {
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getTaskChecklist,
} from "@/actions/checklist";

function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("addChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(addChecklistItem("t1", "item")).rejects.toThrow("Unauthorized");
  });

  it("rejects empty title", async () => {
    loginAs("u1");
    const result = await addChecklistItem("t1", "");
    expect(result.success).toBe(false);
  });

  it("returns error if task not found", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue(null);
    const result = await addChecklistItem("nope", "Item");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найдена");
  });

  it("creates item with correct order", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.checklistItem.aggregate.mockResolvedValue({ _max: { order: 2 } });
    mockPrisma.checklistItem.create.mockResolvedValue({ id: "ci-1" });

    const result = await addChecklistItem("t1", "New item");
    expect(result.success).toBe(true);
    expect(mockPrisma.checklistItem.create).toHaveBeenCalledWith({
      data: { title: "New item", taskId: "t1", order: 3 },
    });
  });

  it("starts from order 0 when no items exist", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.checklistItem.aggregate.mockResolvedValue({ _max: { order: null } });
    mockPrisma.checklistItem.create.mockResolvedValue({ id: "ci-2" });

    await addChecklistItem("t1", "First item");
    expect(mockPrisma.checklistItem.create).toHaveBeenCalledWith({
      data: { title: "First item", taskId: "t1", order: 0 },
    });
  });
});

describe("toggleChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if item not found", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue(null);
    const result = await toggleChecklistItem("nope");
    expect(result.success).toBe(false);
  });

  it("toggles false → true", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue({
      id: "ci-1",
      completed: false,
      task: { projectId: "p1", id: "t1" },
    });
    mockPrisma.checklistItem.update.mockResolvedValue({ completed: true });

    const result = await toggleChecklistItem("ci-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.checklistItem.update).toHaveBeenCalledWith({
      where: { id: "ci-1" },
      data: expect.objectContaining({
        completed: true,
        completedAt: expect.any(Date),
      }),
    });
  });

  it("toggles true → false", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue({
      id: "ci-1",
      completed: true,
      task: { projectId: "p1", id: "t1" },
    });
    mockPrisma.checklistItem.update.mockResolvedValue({ completed: false });

    const result = await toggleChecklistItem("ci-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.checklistItem.update).toHaveBeenCalledWith({
      where: { id: "ci-1" },
      data: {
        completed: false,
        completedAt: null,
      },
    });
  });
});

describe("updateChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if item not found", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue(null);
    const result = await updateChecklistItem("nope", "new title");
    expect(result.success).toBe(false);
  });

  it("updates title successfully", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue({
      id: "ci-1",
      task: { projectId: "p1", id: "t1" },
    });
    mockPrisma.checklistItem.update.mockResolvedValue({});

    const result = await updateChecklistItem("ci-1", "Updated");
    expect(result.success).toBe(true);
    expect(mockPrisma.checklistItem.update).toHaveBeenCalledWith({
      where: { id: "ci-1" },
      data: { title: "Updated" },
    });
  });
});

describe("deleteChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if not found", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue(null);
    const result = await deleteChecklistItem("nope");
    expect(result.success).toBe(false);
  });

  it("deletes item successfully", async () => {
    loginAs("u1");
    mockPrisma.checklistItem.findUnique.mockResolvedValue({
      id: "ci-1",
      task: { projectId: "p1", id: "t1" },
    });
    mockPrisma.checklistItem.delete.mockResolvedValue({});

    const result = await deleteChecklistItem("ci-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.checklistItem.delete).toHaveBeenCalledWith({
      where: { id: "ci-1" },
    });
  });
});

describe("getTaskChecklist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns checklist items ordered by order", async () => {
    const items = [
      { id: "ci-1", title: "Item 1", order: 0 },
      { id: "ci-2", title: "Item 2", order: 1 },
    ];
    mockPrisma.checklistItem.findMany.mockResolvedValue(items);

    const result = await getTaskChecklist("t1");
    expect(result).toEqual(items);
    expect(mockPrisma.checklistItem.findMany).toHaveBeenCalledWith({
      where: { taskId: "t1" },
      orderBy: { order: "asc" },
    });
  });
});
