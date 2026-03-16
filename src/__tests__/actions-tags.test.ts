/**
 * AUDIT TEST SUITE: Tag Actions
 * Tests createTag, updateTag, deleteTag, addTagToTask, removeTagFromTask, getProjectTags
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    task: { findUnique: vi.fn() },
    tag: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    taskTag: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    taskActivity: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/actions/activity", () => ({ logActivity: vi.fn() }));

import {
  createTag,
  updateTag,
  deleteTag,
  getProjectTags,
  addTagToTask,
  removeTagFromTask,
} from "@/actions/tags";

function loginAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

describe("createTag", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated user", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createTag("p1", { name: "Bug" })).rejects.toThrow("Unauthorized");
  });

  it("rejects empty name", async () => {
    loginAs("u1");
    const result = await createTag("p1", { name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate tag name", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue({ id: "existing" });
    const result = await createTag("p1", { name: "Bug" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("уже существует");
  });

  it("creates tag with default color", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue(null);
    mockPrisma.tag.create.mockResolvedValue({ id: "tag-1" });

    const result = await createTag("p1", { name: "Feature" });
    expect(result.success).toBe(true);
    expect(mockPrisma.tag.create).toHaveBeenCalledWith({
      data: { name: "Feature", color: "#6366f1", projectId: "p1" },
    });
  });

  it("creates tag with custom color", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue(null);
    mockPrisma.tag.create.mockResolvedValue({ id: "tag-2" });

    const result = await createTag("p1", { name: "Urgent", color: "#ff0000" });
    expect(result.success).toBe(true);
    expect(mockPrisma.tag.create).toHaveBeenCalledWith({
      data: { name: "Urgent", color: "#ff0000", projectId: "p1" },
    });
  });
});

describe("updateTag", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if tag not found", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue(null);
    const result = await updateTag("nope", { name: "New" });
    expect(result.success).toBe(false);
  });

  it("updates tag successfully", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue({ id: "tag-1", projectId: "p1" });
    mockPrisma.tag.update.mockResolvedValue({});

    const result = await updateTag("tag-1", { name: "Updated", color: "#aabbcc" });
    expect(result.success).toBe(true);
  });
});

describe("deleteTag", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if tag not found", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue(null);
    const result = await deleteTag("nope");
    expect(result.success).toBe(false);
  });

  it("deletes tag successfully", async () => {
    loginAs("u1");
    mockPrisma.tag.findUnique.mockResolvedValue({ id: "tag-1", projectId: "p1" });
    mockPrisma.tag.delete.mockResolvedValue({});

    const result = await deleteTag("tag-1");
    expect(result.success).toBe(true);
  });
});

describe("addTagToTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if task or tag not found", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue(null);
    mockPrisma.tag.findUnique.mockResolvedValue(null);

    const result = await addTagToTask("t1", "tag-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не найдены");
  });

  it("rejects cross-project tag assignment", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.tag.findUnique.mockResolvedValue({ name: "Bug", projectId: "p2" });

    const result = await addTagToTask("t1", "tag-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("не принадлежит");
  });

  it("rejects duplicate tag assignment", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.tag.findUnique.mockResolvedValue({ name: "Bug", projectId: "p1" });
    mockPrisma.taskTag.findUnique.mockResolvedValue({ taskId: "t1", tagId: "tag-1" });

    const result = await addTagToTask("t1", "tag-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("уже привязан");
  });

  it("assigns tag successfully", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.tag.findUnique.mockResolvedValue({ name: "Bug", projectId: "p1" });
    mockPrisma.taskTag.findUnique.mockResolvedValue(null);
    mockPrisma.taskTag.create.mockResolvedValue({});

    const result = await addTagToTask("t1", "tag-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.taskTag.create).toHaveBeenCalledWith({
      data: { taskId: "t1", tagId: "tag-1" },
    });
  });
});

describe("removeTagFromTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if task or tag not found", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue(null);
    mockPrisma.tag.findUnique.mockResolvedValue(null);

    const result = await removeTagFromTask("t1", "tag-1");
    expect(result.success).toBe(false);
  });

  it("removes tag successfully", async () => {
    loginAs("u1");
    mockPrisma.task.findUnique.mockResolvedValue({ projectId: "p1" });
    mockPrisma.tag.findUnique.mockResolvedValue({ name: "Bug" });
    mockPrisma.taskTag.delete.mockResolvedValue({});

    const result = await removeTagFromTask("t1", "tag-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.taskTag.delete).toHaveBeenCalledWith({
      where: { taskId_tagId: { taskId: "t1", tagId: "tag-1" } },
    });
  });
});

describe("getProjectTags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns tags sorted by name", async () => {
    const tags = [
      { id: "t1", name: "Bug", color: "#ff0000" },
      { id: "t2", name: "Feature", color: "#00ff00" },
    ];
    mockPrisma.tag.findMany.mockResolvedValue(tags);

    const result = await getProjectTags("p1");
    expect(result).toEqual(tags);
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
      where: { projectId: "p1" },
      orderBy: { name: "asc" },
    });
  });
});
