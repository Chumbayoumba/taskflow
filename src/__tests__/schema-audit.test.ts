/**
 * AUDIT TEST SUITE: Prisma Schema Completeness
 * Reads the schema file and verifies all required models, fields, relations and indexes exist.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

let schema: string;

beforeAll(() => {
  schema = fs.readFileSync(
    path.resolve(__dirname, "../../prisma/schema.prisma"),
    "utf-8"
  );
});

// ─────────────── Helper ───────────────
function modelBlock(name: string): string {
  const regex = new RegExp(`model\\s+${name}\\s*\\{([^}]+)\\}`, "s");
  const match = schema.match(regex);
  return match?.[1] ?? "";
}

// ─────────────── Models Exist ───────────────
describe("Schema: Required Models", () => {
  const REQUIRED_MODELS = [
    "User",
    "Project",
    "ProjectMember",
    "Task",
    "Notification",
    "Comment",
    "ChecklistItem",
    "TaskDependency",
    "Tag",
    "TaskTag",
    "TaskActivity",
  ];

  for (const model of REQUIRED_MODELS) {
    it(`has model ${model}`, () => {
      expect(schema).toContain(`model ${model}`);
    });
  }

  it("has exactly 11 models", () => {
    const modelCount = (schema.match(/^model\s+\w+/gm) || []).length;
    expect(modelCount).toBe(11);
  });
});

// ─────────────── Comment Model ───────────────
describe("Schema: Comment model", () => {
  it("has required fields", () => {
    const block = modelBlock("Comment");
    expect(block).toContain("id");
    expect(block).toContain("content");
    expect(block).toContain("taskId");
    expect(block).toContain("authorId");
    expect(block).toContain("createdAt");
    expect(block).toContain("updatedAt");
  });

  it("has relations to Task and User", () => {
    const block = modelBlock("Comment");
    expect(block).toContain("task");
    expect(block).toContain("author");
    expect(block).toMatch(/fields:\s*\[taskId\]/);
    expect(block).toMatch(/fields:\s*\[authorId\]/);
  });

  it("has index on (taskId, createdAt)", () => {
    const block = modelBlock("Comment");
    expect(block).toMatch(/@@index\(\[taskId,\s*createdAt\]\)/);
  });

  it("cascade deletes on task and author", () => {
    const block = modelBlock("Comment");
    expect(block).toContain("onDelete: Cascade");
  });
});

// ─────────────── ChecklistItem Model ───────────────
describe("Schema: ChecklistItem model", () => {
  it("has required fields", () => {
    const block = modelBlock("ChecklistItem");
    expect(block).toContain("id");
    expect(block).toContain("title");
    expect(block).toContain("completed");
    expect(block).toContain("order");
    expect(block).toContain("taskId");
  });

  it("completed defaults to false", () => {
    const block = modelBlock("ChecklistItem");
    expect(block).toMatch(/completed\s+Boolean\s+@default\(false\)/);
  });

  it("order defaults to 0", () => {
    const block = modelBlock("ChecklistItem");
    expect(block).toMatch(/order\s+Int\s+@default\(0\)/);
  });

  it("has index on (taskId, order)", () => {
    const block = modelBlock("ChecklistItem");
    expect(block).toMatch(/@@index\(\[taskId,\s*order\]\)/);
  });
});

// ─────────────── TaskDependency Model ───────────────
describe("Schema: TaskDependency model", () => {
  it("has required fields", () => {
    const block = modelBlock("TaskDependency");
    expect(block).toContain("id");
    expect(block).toContain("taskId");
    expect(block).toContain("dependsOnId");
    expect(block).toContain("createdAt");
  });

  it("has unique constraint on (taskId, dependsOnId)", () => {
    const block = modelBlock("TaskDependency");
    expect(block).toMatch(/@@unique\(\[taskId,\s*dependsOnId\]\)/);
  });

  it("has two relations to Task", () => {
    const block = modelBlock("TaskDependency");
    expect(block).toContain('"TaskDependencies"');
    expect(block).toContain('"TaskDependedOnBy"');
  });

  it("cascade deletes", () => {
    const block = modelBlock("TaskDependency");
    expect(block).toContain("onDelete: Cascade");
  });
});

// ─────────────── Tag Model ───────────────
describe("Schema: Tag model", () => {
  it("has required fields", () => {
    const block = modelBlock("Tag");
    expect(block).toContain("id");
    expect(block).toContain("name");
    expect(block).toContain("color");
    expect(block).toContain("projectId");
  });

  it("has unique constraint on (name, projectId)", () => {
    const block = modelBlock("Tag");
    expect(block).toMatch(/@@unique\(\[name,\s*projectId\]\)/);
  });

  it("has relation to Project", () => {
    const block = modelBlock("Tag");
    expect(block).toContain("project");
  });

  it("has taskTags relation", () => {
    const block = modelBlock("Tag");
    expect(block).toContain("taskTags");
  });
});

// ─────────────── TaskTag Model ───────────────
describe("Schema: TaskTag model", () => {
  it("has composite PK (taskId, tagId)", () => {
    const block = modelBlock("TaskTag");
    expect(block).toMatch(/@@id\(\[taskId,\s*tagId\]\)/);
  });

  it("has relations to Task and Tag", () => {
    const block = modelBlock("TaskTag");
    expect(block).toContain("task");
    expect(block).toContain("tag");
  });

  it("cascade deletes", () => {
    const block = modelBlock("TaskTag");
    expect(block).toContain("onDelete: Cascade");
  });
});

// ─────────────── TaskActivity Model ───────────────
describe("Schema: TaskActivity model", () => {
  it("has required fields", () => {
    const block = modelBlock("TaskActivity");
    expect(block).toContain("id");
    expect(block).toContain("action");
    expect(block).toContain("oldValue");
    expect(block).toContain("newValue");
    expect(block).toContain("taskId");
    expect(block).toContain("userId");
    expect(block).toContain("createdAt");
  });

  it("has index on (taskId, createdAt)", () => {
    const block = modelBlock("TaskActivity");
    expect(block).toMatch(/@@index\(\[taskId,\s*createdAt\]\)/);
  });

  it("has relations to Task and User", () => {
    const block = modelBlock("TaskActivity");
    expect(block).toContain("task");
    expect(block).toContain("user");
  });
});

// ─────────────── Task Model (new relations) ───────────────
describe("Schema: Task model - new relations", () => {
  it("has comments relation", () => {
    const block = modelBlock("Task");
    expect(block).toContain("comments");
    expect(block).toContain("Comment[]");
  });

  it("has checklistItems relation", () => {
    const block = modelBlock("Task");
    expect(block).toContain("checklistItems");
    expect(block).toContain("ChecklistItem[]");
  });

  it("has dependencies and dependedOnBy relations", () => {
    const block = modelBlock("Task");
    expect(block).toContain("dependencies");
    expect(block).toContain("dependedOnBy");
    expect(block).toContain('"TaskDependencies"');
    expect(block).toContain('"TaskDependedOnBy"');
  });

  it("has taskTags relation", () => {
    const block = modelBlock("Task");
    expect(block).toContain("taskTags");
    expect(block).toContain("TaskTag[]");
  });

  it("has activities relation", () => {
    const block = modelBlock("Task");
    expect(block).toContain("activities");
    expect(block).toContain("TaskActivity[]");
  });

  it("has deadline index", () => {
    const block = modelBlock("Task");
    expect(block).toMatch(/@@index\(\[deadline\]\)/);
  });
});

// ─────────────── User Model (new relations) ───────────────
describe("Schema: User model - new relations", () => {
  it("has comments relation", () => {
    const block = modelBlock("User");
    expect(block).toContain("comments");
    expect(block).toContain("Comment[]");
  });

  it("has activities relation", () => {
    const block = modelBlock("User");
    expect(block).toContain("activities");
    expect(block).toContain("TaskActivity[]");
  });
});

// ─────────────── Project Model (new relations) ───────────────
describe("Schema: Project model - tags relation", () => {
  it("has tags relation", () => {
    const block = modelBlock("Project");
    expect(block).toContain("tags");
    expect(block).toContain("Tag[]");
  });
});

// ─────────────── Generator & Provider ───────────────
describe("Schema: Configuration", () => {
  it("uses prisma-client generator", () => {
    expect(schema).toContain('provider = "prisma-client"');
  });

  it("uses SQLite provider", () => {
    expect(schema).toContain('provider = "sqlite"');
  });

  it("outputs to src/generated/prisma", () => {
    expect(schema).toContain('../src/generated/prisma');
  });
});
