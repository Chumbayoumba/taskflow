/**
 * AUDIT TEST SUITE: Zod Validation Schemas
 * Verifies all new validation schemas work correctly for:
 * - Comments, Checklists, Tags, Dependencies
 */
import { describe, it, expect } from "vitest";

import { createCommentSchema, updateCommentSchema } from "@/validations/comment";
import { addChecklistItemSchema, updateChecklistItemSchema } from "@/validations/checklist";
import { createTagSchema, updateTagSchema } from "@/validations/tag";
import { addDependencySchema } from "@/validations/dependency";

// ─────────────────────────────────────────────
// 1. Comment Schemas
// ─────────────────────────────────────────────
describe("createCommentSchema", () => {
  it("accepts valid content", () => {
    const result = createCommentSchema.safeParse({ content: "Хороший прогресс!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = createCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("пустым");
    }
  });

  it("rejects content longer than 5000 chars", () => {
    const result = createCommentSchema.safeParse({ content: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("accepts content of exactly 5000 chars", () => {
    const result = createCommentSchema.safeParse({ content: "a".repeat(5000) });
    expect(result.success).toBe(true);
  });

  it("accepts content of exactly 1 char", () => {
    const result = createCommentSchema.safeParse({ content: "!" });
    expect(result.success).toBe(true);
  });
});

describe("updateCommentSchema", () => {
  it("accepts valid content", () => {
    const result = updateCommentSchema.safeParse({ content: "Обновлённый комментарий" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = updateCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 2. Checklist Schemas
// ─────────────────────────────────────────────
describe("addChecklistItemSchema", () => {
  it("accepts valid title", () => {
    const result = addChecklistItemSchema.safeParse({ title: "Написать тесты" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = addChecklistItemSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("обязательно");
    }
  });

  it("rejects title longer than 500 chars", () => {
    const result = addChecklistItemSchema.safeParse({ title: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts max length title (500 chars)", () => {
    const result = addChecklistItemSchema.safeParse({ title: "x".repeat(500) });
    expect(result.success).toBe(true);
  });
});

describe("updateChecklistItemSchema", () => {
  it("accepts only title", () => {
    const result = updateChecklistItemSchema.safeParse({ title: "Новое название" });
    expect(result.success).toBe(true);
  });

  it("accepts only completed flag", () => {
    const result = updateChecklistItemSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it("accepts both fields", () => {
    const result = updateChecklistItemSchema.safeParse({ title: "Test", completed: false });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = updateChecklistItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty title string", () => {
    const result = updateChecklistItemSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 3. Tag Schemas
// ─────────────────────────────────────────────
describe("createTagSchema", () => {
  it("accepts name only (color optional)", () => {
    const result = createTagSchema.safeParse({ name: "Bug" });
    expect(result.success).toBe(true);
  });

  it("accepts name with valid hex color", () => {
    const result = createTagSchema.safeParse({ name: "Frontend", color: "#ff5733" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createTagSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 50 chars", () => {
    const result = createTagSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format (no #)", () => {
    const result = createTagSchema.safeParse({ name: "Test", color: "ff5733" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format (too short)", () => {
    const result = createTagSchema.safeParse({ name: "Test", color: "#fff" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format (8 chars)", () => {
    const result = createTagSchema.safeParse({ name: "Test", color: "#ff5733aa" });
    expect(result.success).toBe(false);
  });

  it("accepts uppercase hex color", () => {
    const result = createTagSchema.safeParse({ name: "Test", color: "#FF5733" });
    expect(result.success).toBe(true);
  });
});

describe("updateTagSchema", () => {
  it("accepts partial update (name only)", () => {
    const result = updateTagSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update (color only)", () => {
    const result = updateTagSchema.safeParse({ color: "#aabbcc" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateTagSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid color", () => {
    const result = updateTagSchema.safeParse({ color: "not-a-color" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 4. Dependency Schema
// ─────────────────────────────────────────────
describe("addDependencySchema", () => {
  it("accepts valid dependsOnId", () => {
    const result = addDependencySchema.safeParse({ dependsOnId: "clxxxxxxxxxxxxxx" });
    expect(result.success).toBe(true);
  });

  it("rejects empty dependsOnId", () => {
    const result = addDependencySchema.safeParse({ dependsOnId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("задачу");
    }
  });

  it("rejects missing dependsOnId", () => {
    const result = addDependencySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
