import { describe, it, expect } from "vitest";
import {
  parseTaskId,
  parseChainId,
  formatTaskId,
  formatChainId,
  formatSequence,
  parseTaskMarkdown,
  serializeTaskMarkdown,
} from "../task-parser.js";
import type { Task } from "../types.js";

describe("task-parser", () => {
  describe("parseTaskId", () => {
    it("parses valid task ID", () => {
      const result = parseTaskId("001-setup-api");
      expect(result).toEqual({ sequence: 1, slug: "setup-api" });
    });

    it("parses multi-digit sequence", () => {
      const result = parseTaskId("042-complex-task");
      expect(result).toEqual({ sequence: 42, slug: "complex-task" });
    });

    it("returns null for invalid format", () => {
      expect(parseTaskId("invalid")).toBeNull();
      expect(parseTaskId("1-short")).toBeNull();
      expect(parseTaskId("abc-letters")).toBeNull();
    });
  });

  describe("parseChainId", () => {
    it("parses valid chain ID", () => {
      const result = parseChainId("CHAIN-001-profile-backend");
      expect(result).toEqual({ sequence: 1, slug: "profile-backend" });
    });

    it("returns null for invalid format", () => {
      expect(parseChainId("invalid")).toBeNull();
      expect(parseChainId("CHAIN-1-short")).toBeNull();
      expect(parseChainId("001-no-prefix")).toBeNull();
    });
  });

  describe("formatSequence", () => {
    it("pads single digit", () => {
      expect(formatSequence(1)).toBe("001");
    });

    it("pads double digit", () => {
      expect(formatSequence(42)).toBe("042");
    });

    it("handles triple digit", () => {
      expect(formatSequence(123)).toBe("123");
    });
  });

  describe("formatTaskId", () => {
    it("formats task ID correctly", () => {
      expect(formatTaskId(1, "setup-api")).toBe("001-setup-api");
      expect(formatTaskId(42, "complex")).toBe("042-complex");
    });
  });

  describe("formatChainId", () => {
    it("formats chain ID correctly", () => {
      expect(formatChainId(1, "profile")).toBe("CHAIN-001-profile");
      expect(formatChainId(99, "backend")).toBe("CHAIN-099-backend");
    });
  });

  describe("parseTaskMarkdown", () => {
    const sampleMarkdown = `# Task: Set up API routes

**Chain**: CHAIN-001-test  
**Task**: 001-setup-api  
**Status**: backlog  
**Created**: 2025-12-05

---

## Objective

Create the API routes for the profile feature.

---

## Expected Files

- \`app/api/profile/route.ts\`
- \`lib/profile/types.ts\`

---

## Acceptance Criteria

- [ ] Routes respond with correct status codes
- [ ] Input validation works

---

## Notes

Some notes here.
`;

    it("parses task markdown correctly", () => {
      const task = parseTaskMarkdown(sampleMarkdown, "CHAIN-001-test", "backlog");
      
      expect(task).not.toBeNull();
      expect(task!.id).toBe("001-setup-api");
      expect(task!.sequence).toBe(1);
      expect(task!.slug).toBe("setup-api");
      expect(task!.title).toBe("Set up API routes");
      expect(task!.chainId).toBe("CHAIN-001-test");
      expect(task!.status).toBe("backlog");
      expect(task!.description).toContain("Create the API routes");
      expect(task!.expectedFiles).toContain("app/api/profile/route.ts");
      expect(task!.acceptance).toContain("Routes respond with correct status codes");
    });

    it("returns null for invalid markdown", () => {
      expect(parseTaskMarkdown("no title here", "CHAIN-001", "todo")).toBeNull();
      expect(parseTaskMarkdown("# Task: Title\n\nNo task ID", "CHAIN-001", "todo")).toBeNull();
    });
  });

  describe("serializeTaskMarkdown", () => {
    it("serializes task to markdown", () => {
      const task: Task = {
        id: "001-test",
        sequence: 1,
        slug: "test",
        status: "todo",
        chainId: "CHAIN-001-example",
        title: "Test Task",
        description: "Do something",
        expectedFiles: ["file1.ts", "file2.ts"],
        acceptance: ["Criterion 1", "Criterion 2"],
        constraints: ["Constraint 1"],
        notes: "Some notes",
        createdAt: new Date("2025-12-05"),
        updatedAt: new Date("2025-12-05"),
      };

      const markdown = serializeTaskMarkdown(task);

      expect(markdown).toContain("# Task: Test Task");
      expect(markdown).toContain("**Chain**: CHAIN-001-example");
      expect(markdown).toContain("**Task**: 001-test");
      expect(markdown).toContain("**Status**: todo");
      expect(markdown).toContain("## Objective");
      expect(markdown).toContain("Do something");
      expect(markdown).toContain("`file1.ts`");
      expect(markdown).toContain("- [ ] Criterion 1");
      expect(markdown).toContain("- Constraint 1");
      expect(markdown).toContain("Some notes");
    });

    it("round-trips correctly", () => {
      const task: Task = {
        id: "002-roundtrip",
        sequence: 2,
        slug: "roundtrip",
        status: "in-progress",
        chainId: "CHAIN-005-test",
        title: "Roundtrip Test",
        description: "Test roundtrip serialization",
        expectedFiles: ["a.ts"],
        acceptance: ["Works"],
        constraints: [],
        notes: "",
        createdAt: new Date("2025-12-05"),
        updatedAt: new Date("2025-12-05"),
      };

      const markdown = serializeTaskMarkdown(task);
      const parsed = parseTaskMarkdown(markdown, task.chainId, task.status);

      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe(task.id);
      expect(parsed!.title).toBe(task.title);
      expect(parsed!.description).toBe(task.description);
    });
  });
});
