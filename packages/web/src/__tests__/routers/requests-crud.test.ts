/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @test-type unit
 * @user-intent "Verify request CRUD operations work correctly for both CRs and FRs"
 */

import { describe, it, expect } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { TRPCError } from "@trpc/server";
import * as fs from "fs/promises";
import * as path from "path";

const createCaller = createCallerFactory(appRouter);

/**
 * Helper to create an isolated test context with its own directory structure
 */
async function createTestContext() {
  const testProjectRoot = `/tmp/choragen-requests-crud-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Create request directory structure
  const requestDirs = [
    "docs/requests/change-requests/backlog",
    "docs/requests/change-requests/todo",
    "docs/requests/change-requests/doing",
    "docs/requests/change-requests/done",
    "docs/requests/fix-requests/backlog",
    "docs/requests/fix-requests/todo",
    "docs/requests/fix-requests/doing",
    "docs/requests/fix-requests/done",
  ];

  for (const dir of requestDirs) {
    await fs.mkdir(path.join(testProjectRoot, dir), { recursive: true });
  }

  const caller = createCaller({ projectRoot: testProjectRoot });

  const cleanup = async () => {
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  };

  return { caller, cleanup, projectRoot: testProjectRoot };
}

/**
 * Helper to create a CR file directly for testing
 */
async function createCRFile(
  projectRoot: string,
  id: string,
  title: string,
  status: "backlog" | "todo" | "doing" | "done" = "todo"
): Promise<string> {
  const slug = title.toLowerCase().replace(/\s+/g, "-").substring(0, 30);
  const filename = `${id}-${slug}.md`;
  const filePath = path.join(
    projectRoot,
    "docs/requests/change-requests",
    status,
    filename
  );

  const content = `# Change Request: ${title}

**ID**: ${id}  
**Domain**: core  
**Status**: ${status}  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Test description

---

## Why

Test motivation

---

## Scope

**In Scope**:
- Item 1

**Out of Scope**:
- Item 2

---

## Affected Design Documents

- docs/design/test.md

---

## Linked ADRs

- ADR-001

---

## Commits

No commits yet.

---

## Implementation Notes

Test notes

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
`;

  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

/**
 * Helper to create an FR file directly for testing
 */
async function createFRFile(
  projectRoot: string,
  id: string,
  title: string,
  status: "backlog" | "todo" | "doing" | "done" = "todo",
  severity: "high" | "medium" | "low" = "medium"
): Promise<string> {
  const slug = title.toLowerCase().replace(/\s+/g, "-").substring(0, 30);
  const filename = `${id}-${slug}.md`;
  const filePath = path.join(
    projectRoot,
    "docs/requests/fix-requests",
    status,
    filename
  );

  const content = `# Fix Request: ${title}

**ID**: ${id}  
**Domain**: core  
**Status**: ${status}  
**Created**: 2025-12-10  
**Severity**: ${severity}  
**Owner**: agent  

---

## Problem

Test problem description

---

## Expected Behavior

Expected behavior

---

## Actual Behavior

Actual behavior

---

## Steps to Reproduce

1. Step 1
2. Step 2

---

## Root Cause Analysis

Root cause

---

## Proposed Fix

Proposed fix

---

## Affected Files

- file.ts

---

## Linked ADRs

- ADR-001

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Completion Notes

[Added when moved to done/]
`;

  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

describe("requests CRUD router", () => {
  describe("requests.create", () => {
    it("creates a CR with valid input", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const result = await caller.requests.create({
          type: "cr",
          title: "Add new feature",
          domain: "core",
          description: "This is a new feature",
          owner: "test-user",
        });

        expect(result.success).toBe(true);
        expect(result.metadata.id).toMatch(/^CR-\d{8}-\d{3}$/);
        expect(result.metadata.type).toBe("change-request");
        expect(result.metadata.title).toBe("Add new feature");
        expect(result.metadata.domain).toBe("core");
        expect(result.metadata.status).toBe("todo");
        expect(result.metadata.owner).toBe("test-user");
        expect(result.filePath).toContain("change-requests/todo/");
      } finally {
        await cleanup();
      }
    });

    it("creates an FR with valid input including severity", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const result = await caller.requests.create({
          type: "fr",
          title: "Fix critical bug",
          domain: "web",
          description: "Critical bug needs fixing",
          severity: "high",
        });

        expect(result.success).toBe(true);
        expect(result.metadata.id).toMatch(/^FR-\d{8}-\d{3}$/);
        expect(result.metadata.type).toBe("fix-request");
        expect(result.metadata.title).toBe("Fix critical bug");
        expect(result.metadata.domain).toBe("web");
        expect(result.metadata.severity).toBe("high");
        expect(result.filePath).toContain("fix-requests/todo/");
      } finally {
        await cleanup();
      }
    });

    it("generates unique IDs for multiple requests", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const result1 = await caller.requests.create({
          type: "cr",
          title: "First request",
          domain: "core",
        });

        const result2 = await caller.requests.create({
          type: "cr",
          title: "Second request",
          domain: "core",
        });

        const result3 = await caller.requests.create({
          type: "cr",
          title: "Third request",
          domain: "core",
        });

        // All IDs should be unique
        const ids = [
          result1.metadata.id,
          result2.metadata.id,
          result3.metadata.id,
        ];
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);

        // Sequence numbers should increment
        const seq1 = parseInt(result1.metadata.id.split("-")[2], 10);
        const seq2 = parseInt(result2.metadata.id.split("-")[2], 10);
        const seq3 = parseInt(result3.metadata.id.split("-")[2], 10);

        expect(seq2).toBe(seq1 + 1);
        expect(seq3).toBe(seq2 + 1);
      } finally {
        await cleanup();
      }
    });

    it("creates FR with default medium severity when not specified", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        const result = await caller.requests.create({
          type: "fr",
          title: "Bug without severity",
          domain: "core",
        });

        expect(result.metadata.severity).toBe("medium");
      } finally {
        await cleanup();
      }
    });
  });

  describe("requests.update", () => {
    it("modifies correct fields", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Original Title");

        const result = await caller.requests.update({
          requestId: "CR-20251210-001",
          updates: {
            title: "Updated Title",
            domain: "web",
          },
        });

        expect(result.success).toBe(true);
        expect(result.metadata.title).toBe("Updated Title");
        expect(result.metadata.domain).toBe("web");
      } finally {
        await cleanup();
      }
    });

    it("preserves unmodified content", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        const filePath = await createCRFile(
          projectRoot,
          "CR-20251210-001",
          "Original Title"
        );

        // Update only the title
        await caller.requests.update({
          requestId: "CR-20251210-001",
          updates: {
            title: "New Title",
          },
        });

        // Read updated content
        const updatedContent = await fs.readFile(filePath, "utf-8");

        // Title should be changed
        expect(updatedContent).toContain("# Change Request: New Title");
        expect(updatedContent).not.toContain("# Change Request: Original Title");

        // Other content should be preserved
        expect(updatedContent).toContain("**Domain**: core");
        expect(updatedContent).toContain("## What");
        expect(updatedContent).toContain("Test description");
        expect(updatedContent).toContain("## Why");
        expect(updatedContent).toContain("Test motivation");
      } finally {
        await cleanup();
      }
    });

    it("updates description section", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        const filePath = await createCRFile(
          projectRoot,
          "CR-20251210-001",
          "Test Request"
        );

        await caller.requests.update({
          requestId: "CR-20251210-001",
          updates: {
            description: "This is the new description",
          },
        });

        const content = await fs.readFile(filePath, "utf-8");
        expect(content).toContain("This is the new description");
      } finally {
        await cleanup();
      }
    });

    it("throws NOT_FOUND for non-existent request", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.update({
            requestId: "CR-99999999-999",
            updates: { title: "New Title" },
          })
        ).rejects.toThrow(TRPCError);

        await expect(
          caller.requests.update({
            requestId: "CR-99999999-999",
            updates: { title: "New Title" },
          })
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      } finally {
        await cleanup();
      }
    });
  });

  describe("requests.close", () => {
    it("adds completion notes", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Test Request", "doing");

        const result = await caller.requests.close({
          requestId: "CR-20251210-001",
          completionNotes: "Successfully implemented the feature with all tests passing.",
        });

        expect(result.success).toBe(true);
        expect(result.metadata.status).toBe("done");

        // Verify completion notes in file
        const doneFilePath = path.join(
          projectRoot,
          "docs/requests/change-requests/done",
          "CR-20251210-001-test-request.md"
        );
        const content = await fs.readFile(doneFilePath, "utf-8");
        expect(content).toContain("Successfully implemented the feature with all tests passing.");
      } finally {
        await cleanup();
      }
    });

    it("moves file to done/", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        const originalPath = await createCRFile(
          projectRoot,
          "CR-20251210-001",
          "Test Request",
          "doing"
        );

        await caller.requests.close({
          requestId: "CR-20251210-001",
          completionNotes: "Done!",
        });

        // Original file should not exist
        await expect(fs.access(originalPath)).rejects.toThrow();

        // File should exist in done/
        const doneFilePath = path.join(
          projectRoot,
          "docs/requests/change-requests/done",
          "CR-20251210-001-test-request.md"
        );
        await expect(fs.access(doneFilePath)).resolves.toBeUndefined();
      } finally {
        await cleanup();
      }
    });

    it("rejects non-doing requests", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        // Create a request in todo status
        await createCRFile(projectRoot, "CR-20251210-001", "Todo Request", "todo");

        await expect(
          caller.requests.close({
            requestId: "CR-20251210-001",
            completionNotes: "Trying to close",
          })
        ).rejects.toThrow(TRPCError);

        await expect(
          caller.requests.close({
            requestId: "CR-20251210-001",
            completionNotes: "Trying to close",
          })
        ).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      } finally {
        await cleanup();
      }
    });

    it("rejects backlog requests", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Backlog Request", "backlog");

        await expect(
          caller.requests.close({
            requestId: "CR-20251210-001",
            completionNotes: "Trying to close",
          })
        ).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      } finally {
        await cleanup();
      }
    });

    it("rejects already done requests", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Done Request", "done");

        await expect(
          caller.requests.close({
            requestId: "CR-20251210-001",
            completionNotes: "Trying to close again",
          })
        ).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      } finally {
        await cleanup();
      }
    });

    it("updates status field in content", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Test Request", "doing");

        await caller.requests.close({
          requestId: "CR-20251210-001",
          completionNotes: "Completed",
        });

        const doneFilePath = path.join(
          projectRoot,
          "docs/requests/change-requests/done",
          "CR-20251210-001-test-request.md"
        );
        const content = await fs.readFile(doneFilePath, "utf-8");
        expect(content).toContain("**Status**: done");
        expect(content).not.toContain("**Status**: doing");
      } finally {
        await cleanup();
      }
    });
  });

  describe("requests.delete", () => {
    it("removes file", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        const filePath = await createCRFile(
          projectRoot,
          "CR-20251210-001",
          "To Delete"
        );

        // Verify file exists
        await expect(fs.access(filePath)).resolves.toBeUndefined();

        const result = await caller.requests.delete({
          requestId: "CR-20251210-001",
        });

        expect(result.success).toBe(true);
        expect(result.deletedId).toBe("CR-20251210-001");

        // Verify file is deleted
        await expect(fs.access(filePath)).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("deletes FR files", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        const filePath = await createFRFile(
          projectRoot,
          "FR-20251210-001",
          "Bug to Delete"
        );

        await expect(fs.access(filePath)).resolves.toBeUndefined();

        const result = await caller.requests.delete({
          requestId: "FR-20251210-001",
        });

        expect(result.success).toBe(true);
        await expect(fs.access(filePath)).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("throws NOT_FOUND for non-existent request", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.delete({ requestId: "CR-99999999-999" })
        ).rejects.toThrow(TRPCError);

        await expect(
          caller.requests.delete({ requestId: "CR-99999999-999" })
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      } finally {
        await cleanup();
      }
    });
  });

  describe("error cases", () => {
    it("rejects create with empty title", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.create({
            type: "cr",
            title: "",
            domain: "core",
          })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("rejects create with empty domain", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.create({
            type: "cr",
            title: "Valid Title",
            domain: "",
          })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("rejects update with empty requestId", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.update({
            requestId: "",
            updates: { title: "New Title" },
          })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("rejects close with empty completion notes", async () => {
      const { caller, cleanup, projectRoot } = await createTestContext();
      try {
        await createCRFile(projectRoot, "CR-20251210-001", "Test", "doing");

        await expect(
          caller.requests.close({
            requestId: "CR-20251210-001",
            completionNotes: "",
          })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("rejects delete with empty requestId", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.delete({ requestId: "" })
        ).rejects.toThrow();
      } finally {
        await cleanup();
      }
    });

    it("get throws NOT_FOUND for non-existent request", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.get("CR-99999999-999")
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      } finally {
        await cleanup();
      }
    });

    it("getContent throws NOT_FOUND for non-existent request", async () => {
      const { caller, cleanup } = await createTestContext();
      try {
        await expect(
          caller.requests.getContent("FR-99999999-999")
        ).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      } finally {
        await cleanup();
      }
    });
  });

  describe("temp directory cleanup", () => {
    it("cleanup removes all test files", async () => {
      const { cleanup, projectRoot } = await createTestContext();

      // Verify directory exists
      await expect(fs.access(projectRoot)).resolves.toBeUndefined();

      await cleanup();

      // Verify directory is removed
      await expect(fs.access(projectRoot)).rejects.toThrow();
    });
  });
});
