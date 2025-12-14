// ADR: ADR-001-task-file-format
// CR: CR-20251213-008-session-handoff-gate

/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Validate session handoff gate ensures context preservation during agent transitions"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runSessionHandoffGate,
  createSessionHandoffGate,
  updateSessionHandoffGate,
} from "../gates/session-handoff.js";
import {
  runHandoffValidation,
  parseHandoffContext,
} from "../gates/handoff-validation.js";
import {
  HANDOFF_VALIDATION_CHECKS,
  type HandoffContext,
} from "../gates/handoff-types.js";
import type { Task, TaskStatus, TaskType } from "../../tasks/types.js";

function createTestTask(overrides: {
  id?: string;
  status?: TaskStatus;
  type?: TaskType;
  title?: string;
}): Task {
  return {
    id: overrides.id || "001",
    sequence: 1,
    slug: "test-task",
    status: overrides.status || "todo",
    chainId: "CHAIN-001",
    title: overrides.title || "Test Task",
    description: "Test task description",
    expectedFiles: [],
    acceptance: [],
    constraints: [],
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    type: overrides.type,
  };
}

vi.mock("node:child_process", () => ({
  execFile: vi.fn((_cmd, _args, _opts, callback) => {
    if (callback) {
      callback(null, "", "");
    }
  }),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

const VALID_TASK_CONTENT = `# Task: Test Task

**ID**: 001
**Status**: done
**Chain**: CHAIN-001

---

## Description

Test task description.

---

## Acceptance Criteria

- [x] First criterion
- [x] Second criterion

---

## Completion Notes

Task completed successfully.
`;

const TASK_WITH_HANDOFF_CONTEXT = `# Task: Test Task

**ID**: 001
**Status**: done
**Chain**: CHAIN-001

---

## Description

Test task description.

---

## Acceptance Criteria

- [x] First criterion

---

## Handoff Context

**Session**: 2025-12-14T00:00:00Z
**From**: impl
**To**: control
**State**: Task complete, ready for review

### What was done
- Implemented the feature
- Added tests

### What needs to happen
- Review the implementation
- Merge to main

### Open questions
- None

---

## Completion Notes

Task completed successfully.
`;

const TASK_WITH_PLACEHOLDER = `# Task: Test Task

**ID**: 001
**Status**: in-progress
**Chain**: CHAIN-001

---

## Description

Test task description.

---

## Acceptance Criteria

- [ ] First criterion

---

## Completion Notes

[Added when task is complete]
`;

const TASK_WITH_BLOCKING_FEEDBACK = `# Task: Test Task

**ID**: 001
**Status**: in-progress
**Chain**: CHAIN-001

---

## Description

Test task description.

---

## Acceptance Criteria

- [ ] First criterion

---

## Feedback

- [blocking] Need clarification on requirements

---

## Completion Notes

[Added when task is complete]
`;

const INVALID_TASK_CONTENT = `# Task: Test Task

**ID**: 001

Some content without proper sections.
`;

describe("HandoffValidationCheck types", () => {
  it("should have all expected check types", () => {
    expect(HANDOFF_VALIDATION_CHECKS).toContain("task_format");
    expect(HANDOFF_VALIDATION_CHECKS).toContain("uncommitted_work");
    expect(HANDOFF_VALIDATION_CHECKS).toContain("handoff_notes");
    expect(HANDOFF_VALIDATION_CHECKS).toContain("role_match");
    expect(HANDOFF_VALIDATION_CHECKS).toContain("blocking_feedback");
  });

  const EXPECTED_CHECK_COUNT = 5;
  it("should have exactly 5 check types", () => {
    expect(HANDOFF_VALIDATION_CHECKS).toHaveLength(EXPECTED_CHECK_COUNT);
  });
});

describe("runHandoffValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("task_format check", () => {
    it("should pass when task has required sections", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["task_format"],
      });

      expect(result.valid).toBe(true);
      const formatResult = result.results.find((r) => r.check === "task_format");
      expect(formatResult?.success).toBe(true);
    });

    it("should fail when task is missing required sections", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: INVALID_TASK_CONTENT,
        defaultChecks: ["task_format"],
      });

      expect(result.valid).toBe(false);
      const formatResult = result.results.find((r) => r.check === "task_format");
      expect(formatResult?.success).toBe(false);
      expect(formatResult?.feedback).toBeDefined();
    });

    it("should fail when no task content is available", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        defaultChecks: ["task_format"],
      });

      expect(result.valid).toBe(false);
      const formatResult = result.results.find((r) => r.check === "task_format");
      expect(formatResult?.success).toBe(false);
      expect(formatResult?.feedback).toContain("No task content available to validate");
    });
  });

  describe("uncommitted_work check", () => {
    it("should pass when no task scope is defined", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["uncommitted_work"],
        taskScopeGlobs: [],
      });

      expect(result.valid).toBe(true);
    });

    it("should pass when no uncommitted files match scope", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["uncommitted_work"],
        taskScopeGlobs: ["packages/core/**"],
        modifiedFiles: ["packages/cli/src/index.ts"],
      });

      expect(result.valid).toBe(true);
    });

    it("should fail when uncommitted files match scope", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["uncommitted_work"],
        taskScopeGlobs: ["src/*.ts"],
        modifiedFiles: ["src/index.ts"],
      });

      expect(result.valid).toBe(false);
      const workResult = result.results.find((r) => r.check === "uncommitted_work");
      expect(workResult?.success).toBe(false);
      expect(workResult?.feedback?.[0]).toContain("src/index.ts");
    });
  });

  describe("handoff_notes check", () => {
    it("should pass when handoff context section exists", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: TASK_WITH_HANDOFF_CONTEXT,
        defaultChecks: ["handoff_notes"],
      });

      expect(result.valid).toBe(true);
    });

    it("should pass when completion notes section exists", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["handoff_notes"],
      });

      expect(result.valid).toBe(true);
    });

    it("should fail when notes contain placeholder text", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: TASK_WITH_PLACEHOLDER,
        defaultChecks: ["handoff_notes"],
      });

      expect(result.valid).toBe(false);
      const notesResult = result.results.find((r) => r.check === "handoff_notes");
      expect(notesResult?.success).toBe(false);
      expect(notesResult?.feedback?.[0]).toContain("placeholder");
    });
  });

  describe("role_match check", () => {
    it("should pass for impl task handed to control when done", async () => {
      const task = createTestTask({ status: "done", type: "impl" });

      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        task,
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["role_match"],
      });

      expect(result.valid).toBe(true);
    });

    it("should fail for impl task handed to control when not done", async () => {
      const task = createTestTask({ status: "in-progress", type: "impl" });

      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        task,
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["role_match"],
      });

      expect(result.valid).toBe(false);
      const roleResult = result.results.find((r) => r.check === "role_match");
      expect(roleResult?.success).toBe(false);
    });

    it("should fail for control task handed to impl", async () => {
      const task = createTestTask({ status: "todo", type: "control" });

      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "control",
        to: "impl",
        task,
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["role_match"],
      });

      expect(result.valid).toBe(false);
    });

    it("should pass when no task is provided", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["role_match"],
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("blocking_feedback check", () => {
    it("should pass when no feedback section exists", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["blocking_feedback"],
      });

      expect(result.valid).toBe(true);
    });

    it("should fail when blocking feedback exists", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: TASK_WITH_BLOCKING_FEEDBACK,
        defaultChecks: ["blocking_feedback"],
      });

      expect(result.valid).toBe(false);
      const feedbackResult = result.results.find((r) => r.check === "blocking_feedback");
      expect(feedbackResult?.success).toBe(false);
      expect(feedbackResult?.feedback?.[0]).toContain("blocking");
    });
  });

  describe("configuration", () => {
    it("should run all checks by default", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
      });

      expect(result.results).toHaveLength(HANDOFF_VALIDATION_CHECKS.length);
    });

    it("should only run specified checks", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: VALID_TASK_CONTENT,
        defaultChecks: ["task_format", "handoff_notes"],
      });

      const EXPECTED_CHECKS = 2;
      expect(result.results).toHaveLength(EXPECTED_CHECKS);
    });

    it("should respect requiredChecks for determining validity", async () => {
      const result = await runHandoffValidation({
        projectRoot: "/test",
        from: "impl",
        to: "control",
        taskContent: TASK_WITH_PLACEHOLDER,
        defaultChecks: ["task_format", "handoff_notes"],
        requiredChecks: ["task_format"],
      });

      expect(result.valid).toBe(true);
      const notesResult = result.results.find((r) => r.check === "handoff_notes");
      expect(notesResult?.success).toBe(false);
    });
  });
});

describe("runSessionHandoffGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return valid result when all checks pass", async () => {
    const result = await runSessionHandoffGate({
      projectRoot: "/test",
      from: "impl",
      to: "control",
      taskContent: VALID_TASK_CONTENT,
      checks: ["task_format", "handoff_notes"],
    });

    expect(result.valid).toBe(true);
    expect(result.failedChecks).toBeUndefined();
    expect(result.suggestions).toBeUndefined();
  });

  it("should return suggestions when validation fails", async () => {
    const result = await runSessionHandoffGate({
      projectRoot: "/test",
      from: "impl",
      to: "control",
      taskContent: TASK_WITH_PLACEHOLDER,
      checks: ["handoff_notes"],
    });

    expect(result.valid).toBe(false);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions?.length).toBeGreaterThan(0);
    expect(result.suggestions?.[0].type).toBe("missing_notes");
  });

  it("should generate uncommitted_files suggestion", async () => {
    const result = await runSessionHandoffGate({
      projectRoot: "/test",
      from: "impl",
      to: "control",
      taskContent: VALID_TASK_CONTENT,
      taskScopeGlobs: ["src/*.ts"],
      modifiedFiles: ["src/index.ts"],
      checks: ["uncommitted_work"],
    });

    expect(result.valid).toBe(false);
    expect(result.suggestions?.some((s) => s.type === "uncommitted_files")).toBe(true);
  });

  it("should generate role_mismatch suggestion", async () => {
    const task = createTestTask({ status: "in-progress", type: "impl" });

    const result = await runSessionHandoffGate({
      projectRoot: "/test",
      from: "impl",
      to: "control",
      task,
      taskContent: VALID_TASK_CONTENT,
      checks: ["role_match"],
    });

    expect(result.valid).toBe(false);
    expect(result.suggestions?.some((s) => s.type === "role_mismatch")).toBe(true);
  });

  it("should parse handoff context when validation passes", async () => {
    const result = await runSessionHandoffGate({
      projectRoot: "/test",
      from: "impl",
      to: "control",
      taskContent: TASK_WITH_HANDOFF_CONTEXT,
      checks: ["handoff_notes"],
    });

    expect(result.valid).toBe(true);
    expect(result.context).toBeDefined();
    expect(result.context?.from).toBe("impl");
    expect(result.context?.to).toBe("control");
  });
});

describe("parseHandoffContext", () => {
  it("should parse valid handoff context", () => {
    const context = parseHandoffContext(TASK_WITH_HANDOFF_CONTEXT);

    expect(context).not.toBeNull();
    expect(context?.session).toBe("2025-12-14T00:00:00Z");
    expect(context?.from).toBe("impl");
    expect(context?.to).toBe("control");
    expect(context?.state).toBe("Task complete, ready for review");
    expect(context?.whatDone).toContain("Implemented the feature");
    expect(context?.whatNext).toContain("Review the implementation");
  });

  it("should return null when no handoff context section", () => {
    const context = parseHandoffContext(VALID_TASK_CONTENT);
    expect(context).toBeNull();
  });

  it("should return null when handoff context is malformed", () => {
    const malformed = `## Handoff Context

Some random text without proper format.
`;
    const context = parseHandoffContext(malformed);
    expect(context).toBeNull();
  });
});

describe("createSessionHandoffGate", () => {
  it("should create a gate with correct properties", () => {
    const gate = createSessionHandoffGate("control", "impl");

    expect(gate.type).toBe("session_handoff");
    expect(gate.from).toBe("control");
    expect(gate.to).toBe("impl");
    expect(gate.validated).toBe(false);
    expect(gate.satisfied).toBe(false);
  });

  it("should include optional task and chainId", () => {
    const task = createTestTask({ status: "todo" });

    const gate = createSessionHandoffGate("control", "impl", task, "CHAIN-001");

    expect(gate.task).toBe(task);
    expect(gate.chainId).toBe("CHAIN-001");
  });
});

describe("updateSessionHandoffGate", () => {
  it("should update gate with validation results", () => {
    const gate = createSessionHandoffGate("impl", "control");
    const context: HandoffContext = {
      session: "2025-12-14T00:00:00Z",
      from: "impl",
      to: "control",
      state: "Complete",
      whatDone: ["Done"],
      whatNext: ["Review"],
    };

    const updated = updateSessionHandoffGate(gate, {
      valid: true,
      results: [],
      context,
    });

    expect(updated.validated).toBe(true);
    expect(updated.context).toBe(context);
  });

  it("should preserve original gate properties", () => {
    const task = createTestTask({ status: "done" });
    const gate = createSessionHandoffGate("impl", "control", task, "CHAIN-001");

    const updated = updateSessionHandoffGate(gate, {
      valid: true,
      results: [],
    });

    expect(updated.task).toBe(task);
    expect(updated.chainId).toBe("CHAIN-001");
    expect(updated.from).toBe("impl");
    expect(updated.to).toBe("control");
  });
});
