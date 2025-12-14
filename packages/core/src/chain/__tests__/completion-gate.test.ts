/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Verify chain completion gate orchestration and hook integration"
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { runChainCompletionGate } from "../completion-gate.js";
import { TransitionHookRunner, HookExecutionError } from "../../workflow/hook-runner.js";
import type { Chain, TaskStatus } from "../../tasks/types.js";

const TODAY = "2025-12-14";

function taskMarkdown(options: {
  chainId: string;
  taskId: string;
  status: TaskStatus;
  acceptanceChecked?: boolean;
  completionNotes?: string | null;
  fileScope?: string[];
}): string {
  const acceptance =
    options.acceptanceChecked === false ? "- [ ] unchecked item" : "- [x] checked item";
  const completionNotes =
    options.completionNotes === undefined ? "Finished work" : options.completionNotes;
  const scopeLines = (options.fileScope ?? ["docs/design/**", "src/**"]).map(
    (pattern) => `- \`${pattern}\``
  );

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
    ...scopeLines,
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

async function writeTask(root: string, chainId: string, taskId: string, status: TaskStatus, content: string) {
  const dir = path.join(root, "docs/tasks", status, chainId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${taskId}.md`), content, "utf-8");
}

async function createTempRoot(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), "completion-gate-"));
}

describe("runChainCompletionGate", () => {
  it("returns success when all validations pass", async () => {
    const root = await createTempRoot();
    const chainId = "CHAIN-900-sample";
    await writeTask(
      root,
      chainId,
      "001-sample",
      "done",
      taskMarkdown({ chainId, taskId: "001-sample", status: "done" })
    );

    const chain: Chain = {
      id: chainId,
      sequence: 900,
      slug: "sample",
      requestId: "CR-900",
      title: "Sample chain",
      description: "",
      fileScope: ["src/**"],
      tasks: [
        {
          id: "001-sample",
          sequence: 1,
          slug: "sample",
          status: "done",
          chainId,
          title: "Sample task",
          description: "",
          expectedFiles: [],
          acceptance: [],
          constraints: [],
          notes: "",
          createdAt: new Date(TODAY),
          updatedAt: new Date(TODAY),
          type: "impl",
        },
      ],
      createdAt: new Date(TODAY),
      updatedAt: new Date(TODAY),
    };

    const result = await runChainCompletionGate({
      projectRoot: root,
      chainId,
      chain,
      modifiedFiles: ["src/index.ts", "src/index.test.ts"],
      designDocGlobs: ["docs/design/**"],
      testFileGlobs: ["**/*.test.ts"],
    });

    expect(result.valid).toBe(true);
    expect(result.failedChecks).toBeUndefined();
  });

  it("returns failure when validation fails", async () => {
    const root = await createTempRoot();
    const chainId = "CHAIN-901-fail";
    await writeTask(
      root,
      chainId,
      "001-sample",
      "done",
      taskMarkdown({
        chainId,
        taskId: "001-sample",
        status: "done",
        completionNotes: null,
      })
    );

    const result = await runChainCompletionGate({
      projectRoot: root,
      chainId,
      modifiedFiles: ["docs/design/spec.md", "src/index.ts", "src/index.test.ts"],
      designDocGlobs: ["docs/design/**"],
      testFileGlobs: ["**/*.test.ts"],
    });

    expect(result.valid).toBe(false);
    expect(result.failedChecks).toContain("completion_notes");
  });
});

describe("validation action integration", () => {
  it("blocks chain hooks when validation fails", async () => {
    const root = await createTempRoot();
    const chainId = "CHAIN-902-block";
    await writeTask(
      root,
      chainId,
      "001-sample",
      "done",
      taskMarkdown({
        chainId,
        taskId: "001-sample",
        status: "done",
        acceptanceChecked: false,
      })
    );

    const chain: Chain = {
      id: chainId,
      sequence: 902,
      slug: "block",
      requestId: "CR-902",
      title: "Block chain",
      description: "",
      tasks: [],
      createdAt: new Date(TODAY),
      updatedAt: new Date(TODAY),
      hooks: {
        onComplete: [
          {
            type: "validation",
            modifiedFiles: ["docs/design/spec.md", "src/index.ts"],
            designDocGlobs: ["docs/design/**"],
            testFileGlobs: ["**/*.test.ts"],
          },
        ],
      },
    };

    const runner = new TransitionHookRunner(root);

    await expect(
      runner.runChainHook("onComplete", chain, { workflowId: "WF-VAL", stageIndex: 0, chainId })
    ).rejects.toBeInstanceOf(HookExecutionError);
  });

  it("allows chain hooks when validation passes", async () => {
    const root = await createTempRoot();
    const chainId = "CHAIN-903-pass";
    await writeTask(
      root,
      chainId,
      "001-sample",
      "done",
      taskMarkdown({
        chainId,
        taskId: "001-sample",
        status: "done",
        fileScope: ["src/**"],
      })
    );

    const chain: Chain = {
      id: chainId,
      sequence: 903,
      slug: "pass",
      requestId: "CR-903",
      title: "Pass chain",
      description: "",
      tasks: [],
      createdAt: new Date(TODAY),
      updatedAt: new Date(TODAY),
      hooks: {
        onComplete: [
          {
            type: "validation",
            modifiedFiles: ["src/index.ts", "src/index.test.ts"],
            testFileGlobs: ["**/*.test.ts"],
          },
        ],
      },
    };

    const runner = new TransitionHookRunner(root);
    const result = await runner.runChainHook("onComplete", chain, {
      workflowId: "WF-VAL-PASS",
      stageIndex: 0,
      chainId,
    });

    expect(result.results[0].success).toBe(true);
  });
});
