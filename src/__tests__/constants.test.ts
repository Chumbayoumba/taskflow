/**
 * AUDIT TEST SUITE: Constants & Configuration
 * Verifies all constants, labels, configs are complete and consistent
 */
import { describe, it, expect } from "vitest";

import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTION_LABELS,
  DEFAULT_TAG_COLORS,
  TASK_STATUS_MAP,
  TASK_PRIORITY_MAP,
  FILTER_DEADLINE_OPTIONS,
  MEMBER_ROLES,
  NOTIFICATION_TYPES,
  PROJECT_COLORS,
} from "@/lib/constants";

// ─────────────────────────────────────────────
// 1. Task Statuses
// ─────────────────────────────────────────────
describe("TASK_STATUSES", () => {
  it("has exactly 4 statuses (Kanban columns)", () => {
    expect(TASK_STATUSES).toHaveLength(4);
  });

  it("contains TODO, IN_PROGRESS, REVIEW, DONE in order", () => {
    expect(TASK_STATUSES).toEqual(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
  });

  it("each status has a STATUS_CONFIG entry", () => {
    for (const status of TASK_STATUSES) {
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status].label).toBeTruthy();
      expect(STATUS_CONFIG[status].hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("each status has a TASK_STATUS_MAP entry", () => {
    for (const status of TASK_STATUSES) {
      expect(TASK_STATUS_MAP[status]).toBeTruthy();
    }
  });

  it("STATUS_CONFIG has Russian labels", () => {
    expect(STATUS_CONFIG.TODO.label).toBe("К выполнению");
    expect(STATUS_CONFIG.IN_PROGRESS.label).toBe("В работе");
    expect(STATUS_CONFIG.REVIEW.label).toBe("На проверке");
    expect(STATUS_CONFIG.DONE.label).toBe("Готово");
  });
});

// ─────────────────────────────────────────────
// 2. Task Priorities
// ─────────────────────────────────────────────
describe("TASK_PRIORITIES", () => {
  it("has exactly 4 priorities", () => {
    expect(TASK_PRIORITIES).toHaveLength(4);
  });

  it("contains LOW, MEDIUM, HIGH, URGENT", () => {
    expect(TASK_PRIORITIES).toEqual(["LOW", "MEDIUM", "HIGH", "URGENT"]);
  });

  it("each priority has a PRIORITY_CONFIG entry", () => {
    for (const p of TASK_PRIORITIES) {
      expect(PRIORITY_CONFIG[p]).toBeDefined();
      expect(PRIORITY_CONFIG[p].label).toBeTruthy();
      expect(PRIORITY_CONFIG[p].hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("each priority has a TASK_PRIORITY_MAP entry", () => {
    for (const p of TASK_PRIORITIES) {
      expect(TASK_PRIORITY_MAP[p]).toBeTruthy();
    }
  });

  it("PRIORITY_CONFIG has Russian labels", () => {
    expect(PRIORITY_CONFIG.LOW.label).toBe("Низкий");
    expect(PRIORITY_CONFIG.MEDIUM.label).toBe("Средний");
    expect(PRIORITY_CONFIG.HIGH.label).toBe("Высокий");
    expect(PRIORITY_CONFIG.URGENT.label).toBe("Критичный");
  });
});

// ─────────────────────────────────────────────
// 3. Activity Actions
// ─────────────────────────────────────────────
describe("ACTIVITY_ACTIONS", () => {
  it("has 16 activity types", () => {
    expect(ACTIVITY_ACTIONS).toHaveLength(16);
  });

  it("every action has a label", () => {
    for (const action of ACTIVITY_ACTIONS) {
      expect(ACTIVITY_ACTION_LABELS[action]).toBeTruthy();
      expect(typeof ACTIVITY_ACTION_LABELS[action]).toBe("string");
    }
  });

  it("includes key feature actions", () => {
    const actions = [...ACTIVITY_ACTIONS];
    expect(actions).toContain("CREATED");
    expect(actions).toContain("STATUS_CHANGED");
    expect(actions).toContain("COMMENT_ADDED");
    expect(actions).toContain("CHECKLIST_ITEM_ADDED");
    expect(actions).toContain("TAG_ADDED");
    expect(actions).toContain("DEPENDENCY_ADDED");
    expect(actions).toContain("TITLE_CHANGED");
    expect(actions).toContain("DESCRIPTION_CHANGED");
    expect(actions).toContain("DEADLINE_CHANGED");
    expect(actions).toContain("ASSIGNED");
    expect(actions).toContain("PRIORITY_CHANGED");
  });

  it("label count matches action count", () => {
    expect(Object.keys(ACTIVITY_ACTION_LABELS)).toHaveLength(ACTIVITY_ACTIONS.length);
  });
});

// ─────────────────────────────────────────────
// 4. Tag Colors
// ─────────────────────────────────────────────
describe("DEFAULT_TAG_COLORS", () => {
  it("has at least 5 colors", () => {
    expect(DEFAULT_TAG_COLORS.length).toBeGreaterThanOrEqual(5);
  });

  it("all colors are valid hex", () => {
    for (const color of DEFAULT_TAG_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("has no duplicates", () => {
    const unique = new Set(DEFAULT_TAG_COLORS);
    expect(unique.size).toBe(DEFAULT_TAG_COLORS.length);
  });
});

// ─────────────────────────────────────────────
// 5. Filter Deadline Options
// ─────────────────────────────────────────────
describe("FILTER_DEADLINE_OPTIONS", () => {
  it("has 5 options", () => {
    expect(FILTER_DEADLINE_OPTIONS).toHaveLength(5);
  });

  it("starts with 'all' option", () => {
    expect(FILTER_DEADLINE_OPTIONS[0].value).toBe("all");
  });

  it("includes overdue, today, this_week, no_deadline", () => {
    const values = FILTER_DEADLINE_OPTIONS.map((o) => o.value);
    expect(values).toContain("overdue");
    expect(values).toContain("today");
    expect(values).toContain("this_week");
    expect(values).toContain("no_deadline");
  });

  it("all options have Russian labels", () => {
    for (const option of FILTER_DEADLINE_OPTIONS) {
      expect(option.label).toBeTruthy();
      expect(typeof option.label).toBe("string");
    }
  });
});

// ─────────────────────────────────────────────
// 6. Member Roles
// ─────────────────────────────────────────────
describe("MEMBER_ROLES", () => {
  it("has 3 roles", () => {
    expect(MEMBER_ROLES).toHaveLength(3);
  });

  it("includes OWNER, ADMIN, MEMBER", () => {
    expect(MEMBER_ROLES).toContain("OWNER");
    expect(MEMBER_ROLES).toContain("ADMIN");
    expect(MEMBER_ROLES).toContain("MEMBER");
  });
});

// ─────────────────────────────────────────────
// 7. Notification Types
// ─────────────────────────────────────────────
describe("NOTIFICATION_TYPES", () => {
  it("has at least 5 notification types", () => {
    expect(NOTIFICATION_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it("includes core notification types", () => {
    const types = [...NOTIFICATION_TYPES];
    expect(types).toContain("TASK_ASSIGNED");
    expect(types).toContain("DEADLINE_WARNING");
    expect(types).toContain("TASK_STATUS_CHANGED");
    expect(types).toContain("PROJECT_INVITED");
  });
});

// ─────────────────────────────────────────────
// 8. Project Colors
// ─────────────────────────────────────────────
describe("PROJECT_COLORS", () => {
  it("has at least 10 colors", () => {
    expect(PROJECT_COLORS.length).toBeGreaterThanOrEqual(10);
  });

  it("all are valid hex colors", () => {
    for (const c of PROJECT_COLORS) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
