/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Verify chain completion validation checks work correctly"
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import type { Chain, Task, TaskStatus } from "../../tasks/types.js";
import { runChainValidation } from "../validation-runner.js";
import { CHAIN_VALIDATION_CHECKS } from "../validation-types.js";

const TODAY = "2025-12-14";

function makeTask(taskId: string, status: TaskStatus, overrides: Partial<Task> = {}): Task {
  return {
    id: taskId,
    sequence: 1,
    slug: "sample",
    status,
    chainId: "CHAIN-123-sample",
    title: "Sample task",
    description: "Do the thing",
    expectedFiles: ["src/index.ts"],
    fileScope: ["src/**"],
    acceptance: ["item"],
    constraints: [],
    notes: "",
    createdAt: new Date(TODAY),
    updatedAt: new Date(TODAY),
    type: "impl",
    ...overrides,
  };
}

function makeChain(tasks: Task[], fileScope: string[] = ["src/**"]): Chain {
  return {
    id: "CHAIN-123-sample",
    sequence: 123,
    slug: "sample",
    requestId: "CR-123",
    title: "Chain",
    description: "Example chain",
    fileScope,
    tasks,
    createdAt: new Date(TODAY),
    updatedAt: new Date(TODAY),
  };
}

function taskMarkdown(options: {
  chainId: string;
  taskId: string;
  status: TaskStatus;
  completionNotes?: string | null;
  acceptanceChecked?: boolean;
}): string {
  const completionNotes = options.completionNotes === undefined ? "Finished work" : options.completionNotes;
  const acceptance = options.acceptanceChecked === false ? "- [ ] unchecked item" : "- [x] checked item";

  return [
    `# Task: Sample task`,
    "",
    `**Chain**: ${options.chainId}  `,
    `**Task**: ${options.taskId}  `,
    `**Status**: ${options.status}  `,
    "**Type**: impl  ",
    `**Created**: ${TODAY}`,
    "",
    "---",
    "",
    "## Objective",
    "",
    "Do the thing",
    "",
    "---",
    "",
    "## Expected Files",
    "",
    "- `src/index.ts`",
    "",
    "---",
    "",
    "## File Scope",
    "",
    "- `src/**`",
    "",
    "---",
    "",
    "## Acceptance Criteria",
    "",
    acceptance,
    "",
    "---",
    "",
    "## Constraints",
    "",
    "- none",
    "",
    "---",
    "",
    "## Notes",
    "",
    "- note",
    "",
    "---",
    "",
    "## Completion Notes",
    "",
    completionNotes ?? "",
    "",
  ].join("\n");
}

async function writeTaskFile(root: string, task: Task, content: string) {
  const dir = path.join(root, "docs/tasks", task.status, task.chainId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${task.id}.md`), content, "utf-8");
}

async function createTempRoot(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), "chain-validation-"));
}

describe("runChainValidation", () => {
  it("passes when all checks succeed", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({ chainId: task.chainId, taskId: task.id, status: task.status })
    );
    const chain = makeChain([task], ["src/**"]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      designDocGlobs: ["docs/design/**"],
      testFileGlobs: ["**/*.test.ts"],
    });

    expect(result.valid).toBe(true);
    expect(result.failedChecks).toBeUndefined();
  });

  it("fails task_state when tasks are not done", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "in-review");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({ chainId: task.chainId, taskId: task.id, status: task.status })
    );
    const chain = makeChain([task]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const taskState = result.results.find((r) => r.check === "task_state");
    expect(result.valid).toBe(false);
    expect(taskState?.success).toBe(false);
  });

  it("fails completion_notes when section is missing", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({
        chainId: task.chainId,
        taskId: task.id,
        status: task.status,
        completionNotes: null,
      })
    );
    const chain = makeChain([task]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const completion = result.results.find((r) => r.check === "completion_notes");
    expect(result.valid).toBe(false);
    expect(completion?.success).toBe(false);
  });

  it("fails acceptance_criteria when unchecked items remain", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({
        chainId: task.chainId,
        taskId: task.id,
        status: task.status,
        acceptanceChecked: false,
      })
    );
    const chain = makeChain([task]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const acceptance = result.results.find((r) => r.check === "acceptance_criteria");
    expect(result.valid).toBe(false);
    expect(acceptance?.success).toBe(false);
  });

  it("fails design_doc_updates when design docs are in scope but not modified", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({ chainId: task.chainId, taskId: task.id, status: task.status })
    );
    const chain = makeChain([task], ["docs/design/**"]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      designDocGlobs: ["docs/design/**"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const design = result.results.find((r) => r.check === "design_doc_updates");
    expect(result.valid).toBe(false);
    expect(design?.success).toBe(false);
  });

  it("fails test_coverage when impl tasks exist but no tests were changed", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    await writeTaskFile(
      root,
      task,
      taskMarkdown({ chainId: task.chainId, taskId: task.id, status: task.status })
    );
    const chain = makeChain([task]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const coverage = result.results.find((r) => r.check === "test_coverage");
    expect(result.valid).toBe(false);
    expect(coverage?.success).toBe(false);
  });

  it("handles missing task files gracefully", async () => {
    const root = await createTempRoot();
    const task = makeTask("001-sample", "done");
    const chain = makeChain([task]);

    const result = await runChainValidation(chain, {
      projectRoot: root,
      defaultChecks: [...CHAIN_VALIDATION_CHECKS],
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      testFileGlobs: ["**/*.test.ts"],
    });

    const completion = result.results.find((r) => r.check === "completion_notes");
    expect(result.valid).toBe(false);
    expect(completion?.success).toBe(false);
  });
});
